import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { SyncStatus } from '../domain/SyncState';
import type { IDiffSyncEngine } from './ports/IDiffSyncEngine';
import type { ILogger } from './ports/ILogger';
import * as vscode from 'vscode';
import type { NodeConfigRepository } from '../infra/NodeConfigRepository';
import type { InitializeProjectUseCase } from '@dotagents/diff';
import type { FetchAndInstallRulesUseCase } from './FetchAndInstallRulesUseCase';
import type { GetMissingRulesAgentIdsUseCase } from './GetMissingRulesAgentIdsUseCase';
import type { MigrateExistingAgentsToBridgeUseCase } from './MigrateExistingAgentsToBridgeUseCase';
import { detectAgentFromHostApp } from '../infra/AgentHostDetector';

/**
 * Input values required to run a sync orchestration.
 */
export interface StartSyncOrchestrationProps {
	/** Status bar controller used to communicate orchestration progress. */
	statusBar: { update: (status: SyncStatus, message?: string) => void };
	/** Core sync engine implementation used for file synchronization. */
	syncEngine: IDiffSyncEngine;
	/** Use case responsible for project initialization. */
	initializeProject: InitializeProjectUseCase;
	/** Use case that migrates existing IDE-specific agents into the bridge. */
	migrateExistingAgentsToBridge: MigrateExistingAgentsToBridgeUseCase;
	/** Repository used to persist and read sync configuration. */
	configRepository: NodeConfigRepository;
	/** Use case responsible for fetching and installing selected tool rules. */
	fetchAndInstallRules: FetchAndInstallRulesUseCase;
	/** Use case used to detect missing rules for selected agents. */
	getMissingRulesAgentIds: GetMissingRulesAgentIdsUseCase;
	/** Optional callback to notify about missing rule files. */
	notifyMissingRules?: (workspaceRoot: string, missingAgentIds: string[]) => void | Promise<void>;
	/** Optional callback to resolve/select the active agent before synchronization. */
	selectActiveAgent?: (workspaceRoot: string) => Promise<string | null>;
	/** Optional callback to select an agent when creating a new project sync target. */
	selectAgentForNewProject?: (workspaceRoot: string) => Promise<string | null>;
	/** Optional logger used by the orchestration flow. */
	logger?: ILogger;
}

/**
 * Result returned by the sync orchestration execution.
 */
export interface StartSyncOrchestrationResult {
	/** Indicates whether the orchestration completed successfully. */
	completed: boolean;
}

/**
 * Use case responsible for orchestrating the overall synchronization process.
 * Manages UI updates, project initialization, rule fetching, and executing the sync engine.
 */
export class StartSyncOrchestration {
	private statusBar: { update: (status: SyncStatus, message?: string) => void };
	private syncEngine: IDiffSyncEngine;
	private initializeProject: InitializeProjectUseCase;
	private migrateExistingAgentsToBridge: MigrateExistingAgentsToBridgeUseCase;
	private configRepository: NodeConfigRepository;
	private fetchAndInstallRules: FetchAndInstallRulesUseCase;
	private getMissingRulesAgentIds: GetMissingRulesAgentIdsUseCase;
	private notifyMissingRules?: (
		workspaceRoot: string,
		missingAgentIds: string[],
	) => void | Promise<void>;
	private selectActiveAgent?: (workspaceRoot: string) => Promise<string | null>;
	private selectAgentForNewProject?: (workspaceRoot: string) => Promise<string | null>;
	private logger: ILogger | undefined;

	constructor({
		statusBar,
		syncEngine,
		initializeProject,
		migrateExistingAgentsToBridge,
		configRepository,
		fetchAndInstallRules,
		getMissingRulesAgentIds,
		notifyMissingRules,
		selectActiveAgent,
		selectAgentForNewProject,
		logger,
	}: StartSyncOrchestrationProps) {
		this.statusBar = statusBar;
		this.syncEngine = syncEngine;
		this.initializeProject = initializeProject;
		this.migrateExistingAgentsToBridge = migrateExistingAgentsToBridge;
		this.configRepository = configRepository;
		this.fetchAndInstallRules = fetchAndInstallRules;
		this.getMissingRulesAgentIds = getMissingRulesAgentIds;
		this.notifyMissingRules = notifyMissingRules;
		this.selectActiveAgent = selectActiveAgent;
		this.selectAgentForNewProject = selectAgentForNewProject;
		this.logger = logger;
	}

	/**
	 * Executes the orchestration logic for synchronization.
	 *
	 * @param options Orchestration options (direction, skipping selection)
	 * @returns A promise resolving to an object indicating if the orchestration completed successfully
	 */
	async execute(options?: {
		direction?: 'inbound' | 'outbound';
		skipAgentSelection?: boolean;
	}): Promise<StartSyncOrchestrationResult> {
		this.statusBar.update(SyncStatus.SYNCING);

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			this.statusBar.update(SyncStatus.ERROR, 'No workspace folder open');
			return { completed: false };
		}

		const [firstWorkspace] = workspaceFolders;
		if (!firstWorkspace) {
			this.statusBar.update(SyncStatus.ERROR, 'No workspace folder open');
			return { completed: false };
		}

		const workspaceRoot = firstWorkspace.uri.fsPath;

		try {
			// 1. Check if project is initialized
			const exists = await this.configRepository.exists(workspaceRoot);
			let selectedAgentId: string | null;
			let usedPicker = false;

			if (!exists) {
				// Select tool BEFORE fetch/migration (Sprint 1: herramienta obligatoria)
				selectedAgentId = this.selectAgentForNewProject
					? await this.selectAgentForNewProject(workspaceRoot)
					: null;
				if (!selectedAgentId) {
					this.statusBar.update(SyncStatus.ERROR, 'Select a tool to continue');
					return { completed: false };
				}
				// Fetch rules for selected agent BEFORE migrate (Sprint 3: migration uses YAML rules)
				await this.fetchAndInstallRules.execute(workspaceRoot, {
					agentIds: [selectedAgentId],
				});
				const rulesFile = join(
					workspaceRoot,
					'.agents',
					'.ai',
					'rules',
					`${selectedAgentId}.yaml`,
				);
				if (!existsSync(rulesFile)) {
					this.statusBar.update(
						SyncStatus.ERROR,
						`Reglas faltantes para ${selectedAgentId}`,
					);
					return { completed: false };
				}
				const migrationResult = await this.migrateExistingAgentsToBridge.execute({
					workspaceRoot,
					selectedAgentId,
				});
				if (migrationResult.migrated.length > 0 && this.logger) {
					this.logger.info(
						`Migration: copied ${migrationResult.migrated.map((m) => `${m.dir} → .agents`).join(', ')}`,
					);
				}
				if (this.logger)
					this.logger.info('Project not initialized. Running initialization...');
				else console.log('Project not initialized. Running initialization...');
				await this.initializeProject.execute({ workspaceRoot, force: false });
				if (this.logger) this.logger.info('Initialization complete.');
				else console.log('Initialization complete.');
				// Persist selected agent in newly created config
				const config = await this.configRepository.load(workspaceRoot);
				config.manifest.setCurrentAgent(selectedAgentId);
				config.manifest.setLastActiveAgent(selectedAgentId);
				await this.configRepository.save(config);
			} else {
				// Ensure .ai exists for projects initialized before this was added
				await this.configRepository.ensureAIStructure(workspaceRoot);
				// Resolve selected agent BEFORE fetch (Sprint 2: descargar solo para la herramienta seleccionada)
				const config = await this.configRepository.load(workspaceRoot);
				const currentAgentId = config.manifest.currentAgent;
				if (options?.skipAgentSelection) {
					selectedAgentId = currentAgentId ?? null;
				} else {
					const hostAgentId = detectAgentFromHostApp();
					selectedAgentId = currentAgentId ?? null;
					if (!currentAgentId || currentAgentId !== hostAgentId) {
						if (this.selectActiveAgent) {
							selectedAgentId = await this.selectActiveAgent(workspaceRoot);
							usedPicker = true;
						}
					}
				}
			}

			if (!selectedAgentId) {
				this.statusBar.update(SyncStatus.ERROR, 'Active tool not selected');
				return { completed: false };
			}

			// 2. Fetch and install rules for selected agent only (Sprint 2)
			await this.fetchAndInstallRules.execute(workspaceRoot, { agentIds: [selectedAgentId] });

			let missingIds: string[] = [];
			try {
				missingIds = await this.getMissingRulesAgentIds.execute(workspaceRoot, {
					agentIds: [selectedAgentId],
				});
				if (missingIds.length > 0 && this.notifyMissingRules) {
					await this.notifyMissingRules(workspaceRoot, missingIds);
				}
			} catch (error: unknown) {
				const message = this.getErrorMessage(error);
				if (this.logger)
					this.logger.warn('Missing-rules detection or notification failed:', message);
				else console.warn('Missing-rules detection or notification failed:', message);
			}

			// Guard: do not sync if selected agent has no local rules (Sprint 3)
			if (missingIds.includes(selectedAgentId)) {
				this.statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${selectedAgentId}`);
				return { completed: false };
			}

			// Sync already performed in selectActiveAgent onAfterSave (Sprint 3)
			if (usedPicker && selectedAgentId) {
				this.statusBar.update(SyncStatus.SYNCED);
				return { completed: true };
			}

			// 3. Perform Sync
			const direction = options?.direction ?? 'inbound';
			if (direction === 'inbound') {
				await this.syncEngine.syncAgent(workspaceRoot, selectedAgentId);
			} else {
				await this.syncEngine.syncOutboundAgent(workspaceRoot, selectedAgentId);
			}
			this.statusBar.update(SyncStatus.SYNCED);
			return { completed: true };
		} catch (error: unknown) {
			const message = this.getErrorMessage(error);
			if (this.logger) this.logger.error('Sync failed:', error);
			else console.error('Sync failed:', error);
			this.statusBar.update(SyncStatus.ERROR, message);
			return { completed: false };
		}
	}

	private getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		if (typeof error === 'string') return error;
		return JSON.stringify(error);
	}
}
