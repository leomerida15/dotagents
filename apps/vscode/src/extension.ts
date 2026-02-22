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
import { detectAgentFromHostApp } from './modules/orchestrator/infra/AgentHostDetector';
import { debounce } from './modules/orchestrator/utils/debounce';
import { InitializeProjectUseCase } from '@dotagents/diff';
import { StatusBarManager } from './modules/ui/infra/StatusBarManager';
import { SyncStatus } from './modules/orchestrator/domain/SyncState';

/**
 * Entry point para la extensión DotAgents VSCode.
 * Orquestador principal de la sincronización entre el bridge universal .agents y el IDE local.
 */
export function activate(context: vscode.ExtensionContext) {
	const logger = new ExtensionLogger({
		getWorkspaceRoot: () => vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
	});
	logger.info('DotAgents VSCode is now active');

	async function ensureMakeRulePrompt(workspaceRoot: string, extContext: vscode.ExtensionContext): Promise<void> {
		const targetPath = join(workspaceRoot, '.agents', '.ai', 'rules', 'make_rule_prompt.md');
		if (existsSync(targetPath)) return;
		const templatePath = extContext.asAbsolutePath('access/make_rule_prompt.md');
		const content = await readFile(templatePath, 'utf-8');
		await mkdir(join(workspaceRoot, '.agents', '.ai', 'rules'), { recursive: true });
		await writeFile(targetPath, content, 'utf-8');
	}

	// 1. Inicializar Infraestructura
	const statusBar = new StatusBarManager({ context });
	const configRepo = new NodeConfigRepository();
	const syncEngine = new DiffSyncAdapter({ configRepository: configRepo, logger });
	const getMissingRulesAgentIds = new GetMissingRulesAgentIdsUseCase({
		configRepository: configRepo,
	});

	const inboundAffectedPaths = new Set<string>();
	const outboundAffectedPaths = new Set<string>();

	const runReactiveInboundSync = debounce(async () => {
		const paths = [...inboundAffectedPaths];
		inboundAffectedPaths.clear();
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) return;
		try {
			if (!(await configRepo.exists(workspaceRoot))) return;
			const config = await configRepo.load(workspaceRoot);
			const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
			if (!activeAgentId) return;
			const missingIds = await getMissingRulesAgentIds.execute(workspaceRoot, { agentIds: [activeAgentId] });
			if (missingIds.includes(activeAgentId)) {
				statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${activeAgentId}`);
				return;
			}
			await syncEngine.syncAgent(workspaceRoot, activeAgentId, paths.length ? paths : undefined);
		} catch (e) {
			logger.error('Reactive inbound sync failed:', e);
		}
	}, 400);

	const runReactiveOutboundSync = debounce(async () => {
		const paths = [...outboundAffectedPaths];
		outboundAffectedPaths.clear();
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) return;
		try {
			if (!(await configRepo.exists(workspaceRoot))) return;
			const config = await configRepo.load(workspaceRoot);
			const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
			if (!activeAgentId) return;
			const missingIds = await getMissingRulesAgentIds.execute(workspaceRoot, { agentIds: [activeAgentId] });
			if (missingIds.includes(activeAgentId)) {
				statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${activeAgentId}`);
				return;
			}
			await syncEngine.syncOutboundAgent(workspaceRoot, activeAgentId, paths.length ? paths : undefined);
		} catch (e) {
			logger.error('Reactive outbound sync failed:', e);
		}
	}, 400);

	const scheduleInboundSync = (uri: vscode.Uri) => {
		inboundAffectedPaths.add(uri.fsPath);
		runReactiveInboundSync();
	};
	const scheduleOutboundSync = (uri: vscode.Uri) => {
		outboundAffectedPaths.add(uri.fsPath);
		runReactiveOutboundSync();
	};

	const ideWatcher = new IdeWatcherService({
		onChange: scheduleInboundSync,
		onCreate: scheduleInboundSync,
		onDelete: scheduleInboundSync,
	});
	const agentsWatcher = new AgentsWatcherService({
		onChange: scheduleOutboundSync,
		onCreate: scheduleOutboundSync,
		onDelete: scheduleOutboundSync,
	});
	const ruleProvider = new GitHubRuleProvider({ logger });
	const agentScanner = new FsAgentScanner();

	// 2. Inicializar Casos de Uso
	const initializeProject = new InitializeProjectUseCase({
		configRepository: configRepo,
		ruleProvider: ruleProvider,
		agentScanner: agentScanner
	});

	const fetchAndInstallRules = new FetchAndInstallRulesUseCase({
		ruleProvider,
		configRepository: configRepo,
		logger,
	});

	const migrateExistingAgentsToBridge = new MigrateExistingAgentsToBridgeUseCase({
		configRepository: configRepo,
		syncProject: syncEngine,
		fileSystem: new NodeFileSystem(),
		logger,
	});

	const MAKE_RULE_ACTION = 'Open make_rule.md';

	const notifyMissingRules = async (workspaceRoot: string, missingAgentIds: string[]): Promise<void> => {
		if (missingAgentIds.length === 0) return;
		const idsList = missingAgentIds.join(', ');
		const message = `Some tools have no rules installed: ${idsList}. Create rules using the guide below.`;
		const chosen = await vscode.window.showWarningMessage(message, MAKE_RULE_ACTION);
		if (chosen === MAKE_RULE_ACTION) {
			await ensureMakeRulePrompt(workspaceRoot, context);
			const makeRulePath = join(workspaceRoot, '.agents', '.ai', 'rules', 'make_rule_prompt.md');
			const uri = vscode.Uri.file(makeRulePath);
			await vscode.window.showTextDocument(uri, { preview: false });
		}
	};

	const addAgent = new AddAgentManually({
		onAgentAdded: async (agentId) => {
			// Aquí se conectará con @dotagents/rule para persistir la regla
			// y luego disparar una sincronización inicial
			await startSync.execute();
		}
	});

	const showSyncDirectionPicker = async (): Promise<'inbound' | 'outbound' | null> => {
		type DirectionQuickPickItem = vscode.QuickPickItem & { value: 'inbound' | 'outbound' };
		const items: DirectionQuickPickItem[] = [
			{ label: 'IDE → .agents', description: 'Copy from IDE to bridge', value: 'inbound' },
			{ label: '.agents → IDE', description: 'Copy from bridge to IDE', value: 'outbound' },
		];
		const selection = await vscode.window.showQuickPick(items, { placeHolder: 'Select sync direction' });
		return selection?.value ?? null;
	};

	type AgentQuickPickItem = vscode.QuickPickItem & { id: string };

	const selectActiveAgentBase = async (
		workspaceRoot: string,
		onAfterSave?: (agentId: string, config: Awaited<ReturnType<NodeConfigRepository['load']>>) => void | Promise<void>,
	): Promise<string | null> => {
		const config = await configRepo.load(workspaceRoot);
		const agents = config.agents;

		if (!agents.length) {
			vscode.window.showInformationMessage('No agents detected for selection.');
			return null;
		}

		const items: AgentQuickPickItem[] = agents.map((agent) => ({
			id: agent.id,
			label: agent.name || agent.id,
			description: agent.id,
			detail: agent.sourceRoot,
		}));

		const hostAgentId = detectAgentFromHostApp();
		const manifestAgentId = config.manifest.currentAgent;
		const defaultItem =
			items.find((item) => item.id === hostAgentId)
			?? (manifestAgentId ? items.find((item) => item.id === manifestAgentId) : undefined);

		const selection = await new Promise<AgentQuickPickItem | undefined>((resolve) => {
			const quickPick = vscode.window.createQuickPick<AgentQuickPickItem>();
			quickPick.items = items;
			quickPick.placeholder = 'Select the active tool/IDE';
			quickPick.ignoreFocusOut = true;
			if (defaultItem) {
				quickPick.activeItems = [defaultItem];
			}
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
		await configRepo.save(config);
		if (onAfterSave) {
			await onAfterSave(selection.id, config);
		}
		vscode.window.showInformationMessage(`Active tool set to ${selection.label}.`);
		return selection.id;
	};

	const selectActiveAgent = async (workspaceRoot: string) =>
		selectActiveAgentBase(workspaceRoot, async (agentId, config) => {
			ideWatcher.dispose();
			ideWatcher.register(workspaceRoot, agentId, config);
		});

	const selectAgentForNewProject = async (workspaceRoot: string): Promise<string | null> => {
		const agents = await agentScanner.detectAgents(workspaceRoot);
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
		const selection = await new Promise<AgentQuickPickItem | undefined>((resolve) => {
			const quickPick = vscode.window.createQuickPick<AgentQuickPickItem>();
			quickPick.items = items;
			quickPick.placeholder = 'Select the active tool/IDE';
			quickPick.ignoreFocusOut = true;
			if (defaultItem) {
				quickPick.activeItems = [defaultItem];
			}
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
	};

	const startSync = new StartSyncOrchestration({
		statusBar,
		syncEngine,
		initializeProject,
		migrateExistingAgentsToBridge,
		configRepository: configRepo,
		fetchAndInstallRules,
		getMissingRulesAgentIds,
		notifyMissingRules,
		selectActiveAgent,
		selectAgentForNewProject,
		logger,
	});

	const setupWatchers = async (workspaceRoot: string): Promise<void> => {
		const exists = await configRepo.exists(workspaceRoot);
		if (!exists) return;

		const config = await configRepo.load(workspaceRoot);
		const activeAgentId = config.manifest.currentAgent ?? detectAgentFromHostApp();
		if (!activeAgentId) return;

		ideWatcher.register(workspaceRoot, activeAgentId, config);
	};

	const setupAgentsWatcher = (workspaceRoot: string): void => {
		agentsWatcher.dispose();
		agentsWatcher.register(workspaceRoot);
	};

	// 3. Registrar Comandos
	const syncCommand = vscode.commands.registerCommand('dotagents-vscode.sync', async () => {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceRoot) {
			vscode.window.showErrorMessage('No workspace folder open');
			return;
		}
		const agentId = await selectActiveAgent(workspaceRoot);
		if (!agentId) return;
		const direction = await showSyncDirectionPicker();
		if (!direction) return;
		await startSync.execute({ direction, skipAgentSelection: true });
	});

	const addAgentCommand = vscode.commands.registerCommand('dotagents-vscode.addAgent', async () => {
		await addAgent.execute();
	});

	const menuCommand = vscode.commands.registerCommand('dotagents-vscode.showMenu', () => {
		vscode.window.showQuickPick([
			{ label: '$(sync) Synchronize Now', id: 'sync' },
			{ label: '$(plus) Add Agent/IDE Manually', id: 'add' },
			{ label: '$(settings) Configure Active Agents', id: 'setup' },
			{ label: '$(question) Generate Rules Prompt', id: 'prompt' }
		]).then(async (selection) => {
			if (selection?.id === 'sync') {
				vscode.commands.executeCommand('dotagents-vscode.sync');
			} else if (selection?.id === 'add') {
				vscode.commands.executeCommand('dotagents-vscode.addAgent');
			} else if (selection?.id === 'setup') {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder open');
					return;
				}
				selectActiveAgent(workspaceRoot);
			} else if (selection?.id === 'prompt') {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder open');
					return;
				}
				await ensureMakeRulePrompt(workspaceRoot, context);
				const promptPath = join(workspaceRoot, '.agents', '.ai', 'rules', 'make_rule_prompt.md');
				await vscode.window.showTextDocument(vscode.Uri.file(promptPath), { preview: false });
			}
		});
	});

	context.subscriptions.push(syncCommand, addAgentCommand, menuCommand, ideWatcher, agentsWatcher);

	// 4. Ejecutar sincronización inicial y configurar watchers (cuando el workspace esté listo)
	const runInitialSync = async () => {
		ideWatcher.dispose();
		agentsWatcher.dispose();
		const result = await startSync.execute();
		if (!result.completed) return; // User cancelled or error - do not create partial structure
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (workspaceRoot) {
			await ensureMakeRulePrompt(workspaceRoot, context);
			await setupWatchers(workspaceRoot);
			setupAgentsWatcher(workspaceRoot);
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
		context.subscriptions.push(disposable);
	}
}

export function deactivate() { }
