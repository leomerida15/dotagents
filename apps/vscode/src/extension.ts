import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as vscode from 'vscode';
import { StartSyncOrchestration } from './modules/orchestrator/app/StartSyncOrchestration';
import { MigrateExistingAgentsToBridgeUseCase } from './modules/orchestrator/app/MigrateExistingAgentsToBridgeUseCase';
import { FetchAndInstallRulesUseCase } from './modules/orchestrator/app/FetchAndInstallRulesUseCase';
import { GetMissingRulesAgentIdsUseCase } from './modules/orchestrator/app/GetMissingRulesAgentIdsUseCase';
import { AddAgentManually } from './modules/agent-bridge/app/AddAgentManually';
import { DiffSyncAdapter } from './modules/orchestrator/infra/DiffSyncAdapter';
import { NodeConfigRepository } from './modules/orchestrator/infra/NodeConfigRepository';
import { NodeFileSystem } from './modules/orchestrator/infra/NodeFileSystem';
import { GitHubRuleProvider } from './modules/orchestrator/infra/GitHubRuleProvider';
import { FsAgentScanner } from './modules/orchestrator/infra/FsAgentScanner';
import { ExtensionLogger } from './modules/orchestrator/infra/ExtensionLogger';
import { IdeWatcherService } from './modules/orchestrator/infra/IdeWatcherService';
import { AgentsWatcherService } from './modules/orchestrator/infra/AgentsWatcherService';
import { IgnoredPathsRegistry } from './modules/orchestrator/infra/IgnoredPathsRegistry';
import {
	detectAgentFromHostApp,
	getHostAppName,
	isHostIdeRecognized,
} from './modules/orchestrator/infra/AgentHostDetector';
import { debounce } from './modules/orchestrator/utils/debounce';
import { Agent, InitializeProjectUseCase } from '@dotagents/diff';
import { ClientModule } from '@dotagents/rule';
import {
	WORKSPACE_KNOWN_AGENTS,
	getWorkspaceMarker,
} from './modules/orchestrator/domain/WorkspaceAgents';
import { StatusBarManager } from './modules/ui/infra/StatusBarManager';
import { SyncStatus } from './modules/orchestrator/domain/SyncState';

const MAKE_RULE_ACTION = 'Open make_rule.md';
const ADD_AGENT_ACTION = 'Add Agent';
const COOLDOWN_MS = 300;

/**
 * Ensures the make_rule_prompt.md template exists in the workspace.
 *
 * @param workspaceRoot The root of the workspace
 * @param extContext The extension context
 */
async function ensureMakeRulePrompt(
	workspaceRoot: string,
	extContext: vscode.ExtensionContext,
): Promise<void> {
	const targetPath = join(workspaceRoot, '.agents', '.ai', 'rules', 'make_rule_prompt.md');
	if (existsSync(targetPath)) return;
	const templatePath = extContext.asAbsolutePath('access/make_rule_prompt.md');
	const content = await readFile(templatePath, 'utf-8');
	await mkdir(join(workspaceRoot, '.agents', '.ai', 'rules'), { recursive: true });
	await writeFile(targetPath, content, 'utf-8');
}

/**
 * Properties for initializing the ExtensionApp.
 */
interface ExtensionAppProps {
	/** The VSCode extension context */
	context: vscode.ExtensionContext;
}

/**
 * Core application class orchestrating the DotAgents VSCode Extension.
 * Separates concerns into distinct methods for clean initialization.
 */
class ExtensionApp {
	private logger: ExtensionLogger;
	private e2eAgentId: string | null;
	private e2eSyncDirection: 'inbound' | 'outbound' | null;
	private isE2EMode: boolean;

	private statusBar!: StatusBarManager;
	private configRepo!: NodeConfigRepository;
	private syncEngine!: DiffSyncAdapter;
	private getMissingRulesAgentIds!: GetMissingRulesAgentIdsUseCase;
	private ignoredPaths!: IgnoredPathsRegistry;

	private inboundAffectedPaths = new Set<string>();
	private outboundAffectedPaths = new Set<string>();
	private inboundCooldownUntil = 0;
	private outboundCooldownUntil = 0;
	private hasNotifiedUnrecognizedIdeThisSession = false;

	private ideWatcher!: IdeWatcherService;
	private agentsWatcher!: AgentsWatcherService;
	private ruleProvider!: GitHubRuleProvider;
	private agentScanner!: FsAgentScanner;

	private initializeProject!: InitializeProjectUseCase;
	private fetchAndInstallRules!: FetchAndInstallRulesUseCase;
	private migrateExistingAgentsToBridge!: MigrateExistingAgentsToBridgeUseCase;
	private startSync!: StartSyncOrchestration;
	private addAgent!: AddAgentManually;

	/**
	 * Creates an instance of ExtensionApp with the provided properties.
	 * @param props - The properties containing the extension context
	 */
	constructor(private readonly context: vscode.ExtensionContext) {
		this.logger = new ExtensionLogger({
			getWorkspaceRoot: () => vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
		});
		this.e2eAgentId = process.env.DOTAGENTS_E2E_AGENT?.trim() || null;
		const direction = process.env.DOTAGENTS_E2E_SYNC_DIRECTION;
		this.e2eSyncDirection =
			direction === 'inbound' || direction === 'outbound' ? direction : null;
		this.isE2EMode = process.env.DOTAGENTS_E2E === '1' || this.e2eAgentId != null;
	}

	/**
	 * Activates the extension, initializing infrastructure, use cases, commands, and running initial sync.
	 */
	public activate() {
		this.logger.info('DotAgents VSCode is now active');
		this.initializeInfrastructure();
		this.initializeUseCases();
		this.registerCommands();
		this.runInitialSyncAndSetupWatchers();
	}

	/**
	 * Initializes the infrastructure dependencies (status bar, config repository, sync engine, etc.).
	 */
	private initializeInfrastructure() {
		this.statusBar = new StatusBarManager({ context: this.context });
		this.configRepo = new NodeConfigRepository();
		this.syncEngine = new DiffSyncAdapter({
			configRepository: this.configRepo,
			logger: this.logger,
		});
		this.getMissingRulesAgentIds = new GetMissingRulesAgentIdsUseCase({
			configRepository: this.configRepo,
		});
		this.ignoredPaths = new IgnoredPathsRegistry();
		this.ruleProvider = new GitHubRuleProvider({ logger: this.logger });
		this.agentScanner = new FsAgentScanner();

		this.ideWatcher = new IdeWatcherService({
			onChange: (uri) => this.scheduleInboundSync(uri),
			onCreate: (uri) => this.scheduleInboundSync(uri),
			onDelete: (uri) => this.scheduleInboundSync(uri),
		});

		this.agentsWatcher = new AgentsWatcherService({
			onChange: (uri) => this.scheduleOutboundSync(uri),
			onCreate: (uri) => this.scheduleOutboundSync(uri),
			onDelete: (uri) => this.scheduleOutboundSync(uri),
		});
	}

	/**
	 * Initializes the use cases (initialize project, fetch rules, sync, etc.).
	 */
	private initializeUseCases() {
		this.initializeProject = new InitializeProjectUseCase({
			configRepository: this.configRepo,
			ruleProvider: this.ruleProvider,
			agentScanner: this.agentScanner,
		});

		this.fetchAndInstallRules = new FetchAndInstallRulesUseCase({
			ruleProvider: this.ruleProvider,
			configRepository: this.configRepo,
			logger: this.logger,
		});

		this.migrateExistingAgentsToBridge = new MigrateExistingAgentsToBridgeUseCase({
			configRepository: this.configRepo,
			syncProject: this.syncEngine,
			fileSystem: new NodeFileSystem(),
			logger: this.logger,
		});

		this.addAgent = new AddAgentManually({
			getAgentsForPicker: async (workspaceRoot: string) => {
				const baseAgentsFromKnown = WORKSPACE_KNOWN_AGENTS.map((k) =>
					Agent.create({
						id: k.id,
						name: k.id,
						sourceRoot: getWorkspaceMarker(k),
						inbound: [],
						outbound: [],
					}),
				);
				const agents = await this.getMergedAgentsForSelector(
					workspaceRoot,
					baseAgentsFromKnown,
				);
				return agents.map((a) => ({ id: a.id, label: a.name || a.id }));
			},
			onAgentAdded: async (agentId) => {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace open.');
					return;
				}
				await this.handleAddAgent(workspaceRoot, agentId);
			},
		});

		this.startSync = new StartSyncOrchestration({
			statusBar: this.statusBar,
			syncEngine: this.syncEngine,
			initializeProject: this.initializeProject,
			migrateExistingAgentsToBridge: this.migrateExistingAgentsToBridge,
			configRepository: this.configRepo,
			fetchAndInstallRules: this.fetchAndInstallRules,
			getMissingRulesAgentIds: this.getMissingRulesAgentIds,
			notifyMissingRules: this.notifyMissingRules.bind(this),
			selectActiveAgent: this.selectActiveAgent.bind(this),
			selectAgentForNewProject: this.selectAgentForNewProject.bind(this),
			logger: this.logger,
		});
	}

	/**
	 * Registers the VSCode commands (sync, addAgent, configureAgent, showMenu).
	 */
	private registerCommands() {
		const syncCommand = vscode.commands.registerCommand('dotagents-vscode.sync', async () => {
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (!workspaceRoot) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}
			const direction = await this.showSyncDirectionPicker();
			if (!direction) return;
			await this.startSync.execute({ direction });
		});

		const addAgentCommand = vscode.commands.registerCommand(
			'dotagents-vscode.addAgent',
			async () => {
				await this.addAgent.execute();
			},
		);

		const configureAgentCommand = vscode.commands.registerCommand(
			'dotagents-vscode.configureAgent',
			async () => {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder open');
					return;
				}
				await this.selectActiveAgent(workspaceRoot);
			},
		);

		const menuCommand = vscode.commands.registerCommand('dotagents-vscode.showMenu', () => {
			vscode.window
				.showQuickPick([
					{ label: '$(sync) Synchronize Now', id: 'sync' },
					{ label: '$(plus) Add Agent/IDE Manually', id: 'add' },
					{ label: '$(settings) Configure Active Agents', id: 'setup' },
					{ label: '$(question) Generate Rules Prompt', id: 'prompt' },
				])
				.then(async (selection) => {
					if (selection?.id === 'sync') {
						vscode.commands.executeCommand('dotagents-vscode.sync');
					} else if (selection?.id === 'add') {
						vscode.commands.executeCommand('dotagents-vscode.addAgent');
					} else if (selection?.id === 'setup') {
						vscode.commands.executeCommand('dotagents-vscode.configureAgent');
					} else if (selection?.id === 'prompt') {
						const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
						if (!workspaceRoot) {
							vscode.window.showErrorMessage('No workspace folder open');
							return;
						}
						await ensureMakeRulePrompt(workspaceRoot, this.context);
						const promptPath = join(
							workspaceRoot,
							'.agents',
							'.ai',
							'rules',
							'make_rule_prompt.md',
						);
						await vscode.window.showTextDocument(vscode.Uri.file(promptPath), {
							preview: false,
						});
					}
				});
		});

		this.context.subscriptions.push(
			syncCommand,
			addAgentCommand,
			configureAgentCommand,
			menuCommand,
			this.ideWatcher,
			this.agentsWatcher,
		);
	}

	/**
	 * Runs the initial synchronization and sets up file watchers for the workspace.
	 */
	private runInitialSyncAndSetupWatchers() {
		const runInitialSync = async () => {
			this.ideWatcher.dispose();
			this.agentsWatcher.dispose();
			const result = await this.startSync.execute();
			if (!result.completed) return;
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (workspaceRoot) {
				await ensureMakeRulePrompt(workspaceRoot, this.context);
				await this.setupWatchers(workspaceRoot);
				this.setupAgentsWatcher(workspaceRoot);
			}
		};

		if (vscode.workspace.workspaceFolders?.length) {
			runInitialSync();
		} else {
			const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
				if (vscode.workspace.workspaceFolders?.length) {
					disposable.dispose();
					runInitialSync();
				}
			});
			this.context.subscriptions.push(disposable);
		}
	}

	/**
	 * Executes reactive inbound synchronization after debouncing.
	 * Aggregates affected paths and syncs them to the bridge.
	 */
	private runReactiveInboundSync = debounce(async () => {
		const paths = [...this.inboundAffectedPaths];
		this.inboundAffectedPaths.clear();
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) return;
		try {
			if (!(await this.configRepo.exists(workspaceRoot))) return;
			const config = await this.configRepo.load(workspaceRoot);
			const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
			if (!activeAgentId) return;
			const missingIds = await this.getMissingRulesAgentIds.execute(workspaceRoot, {
				agentIds: [activeAgentId],
			});
			if (missingIds.includes(activeAgentId)) {
				this.statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${activeAgentId}`);
				return;
			}
			const { writtenPaths } = await this.syncEngine.syncAgent(
				workspaceRoot,
				activeAgentId,
				paths.length ? paths : undefined,
			);
			this.ignoredPaths.add(writtenPaths);
			this.outboundCooldownUntil = Date.now() + COOLDOWN_MS;
		} catch (e) {
			this.logger.error('Reactive inbound sync failed:', e);
		}
	}, 400);

	/**
	 * Executes reactive outbound synchronization after debouncing.
	 * Aggregates affected paths from the bridge and syncs them to the IDE.
	 */
	private runReactiveOutboundSync = debounce(async () => {
		const paths = [...this.outboundAffectedPaths];
		this.outboundAffectedPaths.clear();
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) return;
		try {
			if (!(await this.configRepo.exists(workspaceRoot))) return;
			const config = await this.configRepo.load(workspaceRoot);
			const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
			if (!activeAgentId) return;
			const missingIds = await this.getMissingRulesAgentIds.execute(workspaceRoot, {
				agentIds: [activeAgentId],
			});
			if (missingIds.includes(activeAgentId)) {
				this.statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${activeAgentId}`);
				return;
			}
			const { writtenPaths } = await this.syncEngine.syncOutboundAgent(
				workspaceRoot,
				activeAgentId,
				paths.length ? paths : undefined,
			);
			this.ignoredPaths.add(writtenPaths);
			this.inboundCooldownUntil = Date.now() + COOLDOWN_MS;
		} catch (e) {
			this.logger.error('Reactive outbound sync failed:', e);
		}
	}, 400);

	/**
	 * Schedules an inbound sync for a specific file URI.
	 *
	 * @param uri The URI of the changed file
	 */
	private scheduleInboundSync(uri: vscode.Uri) {
		if (this.ignoredPaths.shouldIgnore(uri.fsPath)) return;
		if (Date.now() < this.inboundCooldownUntil) return;
		this.inboundAffectedPaths.add(uri.fsPath);
		this.runReactiveInboundSync();
	}

	/**
	 * Schedules an outbound sync for a specific file URI.
	 *
	 * @param uri The URI of the changed file
	 */
	private scheduleOutboundSync(uri: vscode.Uri) {
		if (this.ignoredPaths.shouldIgnore(uri.fsPath)) return;
		if (Date.now() < this.outboundCooldownUntil) return;
		this.outboundAffectedPaths.add(uri.fsPath);
		this.runReactiveOutboundSync();
	}

	private async notifyMissingRules(
		workspaceRoot: string,
		missingAgentIds: string[],
	): Promise<void> {
		if (missingAgentIds.length === 0) return;
		const idsList = missingAgentIds.join(', ');
		const message = `Some tools have no rules installed: ${idsList}. Create rules using the guide below.`;
		const chosen = await vscode.window.showWarningMessage(message, MAKE_RULE_ACTION);
		if (chosen === MAKE_RULE_ACTION) {
			await ensureMakeRulePrompt(workspaceRoot, this.context);
			const makeRulePath = join(
				workspaceRoot,
				'.agents',
				'.ai',
				'rules',
				'make_rule_prompt.md',
			);
			const uri = vscode.Uri.file(makeRulePath);
			await vscode.window.showTextDocument(uri, { preview: false });
		}
	}

	private async handleAddAgent(workspaceRoot: string, agentId: string): Promise<void> {
		if (!(await this.configRepo.exists(workspaceRoot))) {
			vscode.window.showErrorMessage('Initialize project first (run Sync).');
			return;
		}
		const config = await this.configRepo.load(workspaceRoot);
		const rulesDir = join(workspaceRoot, '.agents', 'rules');

		let ruleExists = existsSync(join(rulesDir, `${agentId}.yaml`));
		if (!ruleExists) {
			await this.fetchAndInstallRules.execute(workspaceRoot, { agentIds: [agentId] });
			ruleExists = existsSync(join(rulesDir, `${agentId}.yaml`));
		}
		if (!ruleExists) {
			await ensureMakeRulePrompt(workspaceRoot, this.context);
			const makeRulePath = join(
				workspaceRoot,
				'.agents',
				'.ai',
				'rules',
				'make_rule_prompt.md',
			);
			const uri = vscode.Uri.file(makeRulePath);
			await vscode.window.showTextDocument(uri, { preview: false });
			vscode.window.showInformationMessage(
				`No rule for ${agentId}. Create it following make_rule_prompt.md, then run Sync.`,
			);
			return;
		}

		if (!config.agents.find((a) => a.id === agentId)) {
			const getRule = ClientModule.createGetInstalledRuleUseCase(rulesDir);
			const rule = await getRule.execute(agentId);
			if (!rule) {
				vscode.window.showErrorMessage(`Could not load rule for ${agentId}.`);
				return;
			}
			let sourceRoot = rule.sourceRoot;
			if (!sourceRoot) {
				const known = WORKSPACE_KNOWN_AGENTS.find((a) => a.id === agentId);
				sourceRoot = known ? getWorkspaceMarker(known) : `.${agentId}/`;
			}
			const newAgent = Agent.create({
				id: agentId,
				name: agentId,
				sourceRoot,
				inbound: [],
				outbound: [],
			});
			config.addAgent(newAgent);
		}

		config.manifest.setCurrentAgent(agentId);
		config.manifest.setLastActiveAgent(agentId);
		await this.configRepo.save(config);

		const { writtenPaths } = await this.syncEngine.syncNew(workspaceRoot, agentId);
		this.ignoredPaths.add(writtenPaths);
		this.inboundCooldownUntil = Date.now() + COOLDOWN_MS;
		this.outboundCooldownUntil = Date.now() + COOLDOWN_MS;

		this.ideWatcher.dispose();
		this.ideWatcher.register(workspaceRoot, agentId, config);

		this.statusBar.update(SyncStatus.SYNCED, `Agent ${agentId} added and synced.`);
	}

	/**
	 * Notifies the user if the IDE is not recognized and offers options to add it manually or create rules.
	 * @param workspaceRoot - The root directory of the workspace
	 */
	private async notifyUnrecognizedIde(workspaceRoot: string): Promise<void> {
		if (this.isE2EMode) return;
		if (this.hasNotifiedUnrecognizedIdeThisSession) return;
		if (isHostIdeRecognized()) return;
		this.hasNotifiedUnrecognizedIdeThisSession = true;
		const appName = getHostAppName();
		const message = `Tu IDE (${appName}) no está soportado. Puedes añadir reglas manualmente.`;
		const chosen = await vscode.window.showWarningMessage(
			message,
			ADD_AGENT_ACTION,
			MAKE_RULE_ACTION,
		);
		if (chosen === ADD_AGENT_ACTION) {
			await this.addAgent.execute();
		} else if (chosen === MAKE_RULE_ACTION) {
			await ensureMakeRulePrompt(workspaceRoot, this.context);
			const makeRulePath = join(
				workspaceRoot,
				'.agents',
				'.ai',
				'rules',
				'make_rule_prompt.md',
			);
			const uri = vscode.Uri.file(makeRulePath);
			await vscode.window.showTextDocument(uri, { preview: false });
		}
	}

	/**
	 * Shows a quick pick to select the synchronization direction (inbound or outbound).
	 * @returns The selected direction or null if cancelled
	 */
	private async showSyncDirectionPicker(): Promise<'inbound' | 'outbound' | null> {
		if (this.e2eSyncDirection) return this.e2eSyncDirection;
		type DirectionQuickPickItem = vscode.QuickPickItem & { value: 'inbound' | 'outbound' };
		const items: DirectionQuickPickItem[] = [
			{ label: 'IDE → .agents', description: 'Copy from IDE to bridge', value: 'inbound' },
			{ label: '.agents → IDE', description: 'Copy from bridge to IDE', value: 'outbound' },
		];
		const selection = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select sync direction',
		});
		return selection?.value ?? null;
	}

	/**
	 * Gets the list of custom agents from the workspace rules directory.
	 * @param workspaceRoot - The root directory of the workspace
	 * @returns Array of custom agents
	 */
	private async getAgentsFromCustomRules(workspaceRoot: string): Promise<Agent[]> {
		const rulesDir = join(workspaceRoot, '.agents', 'rules');
		try {
			const listRules = ClientModule.createListInstalledRulesUseCase(rulesDir);
			const dtos = await listRules.execute();
			return dtos.map((dto) =>
				Agent.create({
					id: dto.id,
					name: dto.name || dto.id,
					sourceRoot: dto.sourceRoot || `.${dto.id}/`,
					inbound: [],
					outbound: [],
				}),
			);
		} catch {
			return [];
		}
	}

	/**
	 * Merges known base agents with custom agents from the workspace.
	 * @param workspaceRoot - The root directory of the workspace
	 * @param baseAgents - The list of base known agents
	 * @returns Merged list of agents
	 */
	private async getMergedAgentsForSelector(
		workspaceRoot: string,
		baseAgents: Agent[],
	): Promise<Agent[]> {
		const customAgents = await this.getAgentsFromCustomRules(workspaceRoot);
		const baseIds = new Set(baseAgents.map((a) => a.id));
		const customOnly = customAgents.filter((a) => !baseIds.has(a.id));
		return [...baseAgents, ...customOnly];
	}

	/**
	 * Shows a picker to select the active agent with optional callback after saving.
	 * @param workspaceRoot - The root directory of the workspace
	 * @param onAfterSave - Optional callback to execute after the agent is selected
	 * @returns The selected agent ID or null if cancelled
	 */
	private async selectActiveAgentBase(
		workspaceRoot: string,
		onAfterSave?: (
			agentId: string,
			config: Awaited<ReturnType<NodeConfigRepository['load']>>,
		) => void | Promise<void>,
	): Promise<string | null> {
		const config = await this.configRepo.load(workspaceRoot);
		const agents = await this.getMergedAgentsForSelector(workspaceRoot, config.agents);

		if (!agents.length) {
			vscode.window.showInformationMessage('No agents detected for selection.');
			return null;
		}

		type AgentQuickPickItem = vscode.QuickPickItem & { id: string };
		const items: AgentQuickPickItem[] = agents.map((agent) => ({
			id: agent.id,
			label: agent.name || agent.id,
			description: agent.id,
			detail: agent.sourceRoot,
		}));

		if (this.e2eAgentId) {
			const picked = items.find((item) => item.id === this.e2eAgentId) ?? items[0];
			if (!picked) return null;
			config.manifest.setCurrentAgent(picked.id);
			config.manifest.setLastActiveAgent(picked.id);
			await this.configRepo.save(config);
			if (onAfterSave) await onAfterSave(picked.id, config);
			return picked.id;
		}

		const hostAgentId = detectAgentFromHostApp();
		const manifestAgentId = config.manifest.currentAgent;
		const defaultItem =
			items.find((item) => item.id === hostAgentId) ??
			(manifestAgentId ? items.find((item) => item.id === manifestAgentId) : undefined);

		const unrecognizedPlaceholder =
			hostAgentId === 'vscode' && !isHostIdeRecognized()
				? `Tu IDE (${getHostAppName()}) no está en la lista. Usa Add Agent Manually para contribuir reglas.`
				: 'Select the active tool/IDE';

		const selection = await new Promise<AgentQuickPickItem | undefined>((resolve) => {
			const quickPick = vscode.window.createQuickPick<AgentQuickPickItem>();
			quickPick.items = items;
			quickPick.placeholder = unrecognizedPlaceholder;
			quickPick.ignoreFocusOut = true;
			if (defaultItem) quickPick.activeItems = [defaultItem];
			quickPick.onDidAccept(() => {
				const picked = quickPick.selectedItems[0] ?? quickPick.activeItems[0];
				resolve(picked);
				quickPick.hide();
			});
			quickPick.onDidHide(() => {
				quickPick.dispose();
				resolve(undefined);
			});
			quickPick.show();
		});

		if (!selection) return null;

		config.manifest.setCurrentAgent(selection.id);
		config.manifest.setLastActiveAgent(selection.id);
		await this.configRepo.save(config);
		if (onAfterSave) await onAfterSave(selection.id, config);
		vscode.window.showInformationMessage(`Active tool set to ${selection.label}.`);
		return selection.id;
	}

	/**
	 * Handles the selection of an active agent for the workspace.
	 * @param workspaceRoot - The root directory of the workspace
	 */
	private async selectActiveAgent(workspaceRoot: string) {
		return this.selectActiveAgentBase(workspaceRoot, async (agentId, config) => {
			this.ideWatcher.dispose();
			this.ideWatcher.register(workspaceRoot, agentId, config);
			await this.fetchAndInstallRules.execute(workspaceRoot, { agentIds: [agentId] });
			const ruleExists = existsSync(
				join(workspaceRoot, '.agents', 'rules', `${agentId}.yaml`),
			);
			if (ruleExists) {
				const { writtenPaths } = await this.syncEngine.syncNew(workspaceRoot, agentId);
				this.ignoredPaths.add(writtenPaths);
				this.inboundCooldownUntil = Date.now() + COOLDOWN_MS;
				this.outboundCooldownUntil = Date.now() + COOLDOWN_MS;
				this.statusBar.update(SyncStatus.SYNCED, `Tool ${agentId} synced.`);
			}
		});
	}

	/**
	 * Shows a picker to select an agent when initializing a new project.
	 * @param workspaceRoot - The root directory of the workspace
	 * @returns The selected agent ID or null if cancelled
	 */
	private async selectAgentForNewProject(workspaceRoot: string): Promise<string | null> {
		if (this.e2eAgentId) return this.e2eAgentId;
		const baseAgents = await this.agentScanner.detectAgents(workspaceRoot);
		const agents = await this.getMergedAgentsForSelector(workspaceRoot, baseAgents);
		if (!agents.length) {
			vscode.window.showInformationMessage('No tools detected. Add a tool manually.');
			return null;
		}
		type AgentQuickPickItem = vscode.QuickPickItem & { id: string };
		const items: AgentQuickPickItem[] = agents.map((agent) => ({
			id: agent.id,
			label: agent.name || agent.id,
			description: agent.id,
			detail: agent.sourceRoot,
		}));
		const hostAgentId = detectAgentFromHostApp();
		const defaultItem = items.find((item) => item.id === hostAgentId);
		const unrecognizedPlaceholder =
			hostAgentId === 'vscode' && !isHostIdeRecognized()
				? `Tu IDE (${getHostAppName()}) no está en la lista. Usa Add Agent Manually para contribuir reglas.`
				: 'Select the active tool/IDE';
		const selection = await new Promise<AgentQuickPickItem | undefined>((resolve) => {
			const quickPick = vscode.window.createQuickPick<AgentQuickPickItem>();
			quickPick.items = items;
			quickPick.placeholder = unrecognizedPlaceholder;
			quickPick.ignoreFocusOut = true;
			if (defaultItem) quickPick.activeItems = [defaultItem];
			quickPick.onDidAccept(() => {
				const picked = quickPick.selectedItems[0] ?? quickPick.activeItems[0];
				resolve(picked);
				quickPick.hide();
			});
			quickPick.onDidHide(() => {
				quickPick.dispose();
				resolve(undefined);
			});
			quickPick.show();
		});
		return selection?.id ?? null;
	}

	/**
	 * Sets up file watchers for IDE changes in the workspace.
	 * @param workspaceRoot - The root directory of the workspace
	 */
	private async setupWatchers(workspaceRoot: string): Promise<void> {
		await this.notifyUnrecognizedIde(workspaceRoot);
		const exists = await this.configRepo.exists(workspaceRoot);
		if (!exists) return;

		const config = await this.configRepo.load(workspaceRoot);
		const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
		if (!activeAgentId) return;

		this.ideWatcher.register(workspaceRoot, activeAgentId, config);
	}

	/**
	 * Sets up a watcher for changes in the .agents directory.
	 * @param workspaceRoot - The root directory of the workspace
	 */
	private setupAgentsWatcher(workspaceRoot: string): void {
		this.agentsWatcher.dispose();
		this.agentsWatcher.register(workspaceRoot);
	}
}

/**
 * Entry point para la extensión DotAgents VSCode.
 * Orquestador principal de la sincronización entre el bridge universal .agents y el IDE local.
 */
export function activate(context: vscode.ExtensionContext) {
	const app = new ExtensionApp(context);
	app.activate();
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate() {}
