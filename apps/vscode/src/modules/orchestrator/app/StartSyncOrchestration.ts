import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { SyncStatus } from '../domain/SyncState';
import { IDiffSyncEngine } from './ports/IDiffSyncEngine';
import type { ILogger } from './ports/ILogger';
import * as vscode from 'vscode';
import { NodeConfigRepository } from '../infra/NodeConfigRepository';
import { InitializeProjectUseCase } from '@dotagents/diff';
import { FetchAndInstallRulesUseCase } from './FetchAndInstallRulesUseCase';
import { GetMissingRulesAgentIdsUseCase } from './GetMissingRulesAgentIdsUseCase';
import { MigrateExistingAgentsToBridgeUseCase } from './MigrateExistingAgentsToBridgeUseCase';
import { detectAgentFromHostApp } from '../infra/AgentHostDetector';

export interface StartSyncOrchestrationProps {
    statusBar: { update: (status: SyncStatus, message?: string) => void };
    syncEngine: IDiffSyncEngine;
    initializeProject: InitializeProjectUseCase;
    migrateExistingAgentsToBridge: MigrateExistingAgentsToBridgeUseCase;
    configRepository: NodeConfigRepository;
    fetchAndInstallRules: FetchAndInstallRulesUseCase;
    getMissingRulesAgentIds: GetMissingRulesAgentIdsUseCase;
    notifyMissingRules?: (workspaceRoot: string, missingAgentIds: string[]) => void | Promise<void>;
    selectActiveAgent?: (workspaceRoot: string) => Promise<string | null>;
    selectAgentForNewProject?: (workspaceRoot: string) => Promise<string | null>;
    logger?: ILogger;
}

export interface StartSyncOrchestrationResult {
    completed: boolean;
}

export class StartSyncOrchestration {
    private statusBar: { update: (status: SyncStatus, message?: string) => void };
    private syncEngine: IDiffSyncEngine;
    private initializeProject: InitializeProjectUseCase;
    private migrateExistingAgentsToBridge: MigrateExistingAgentsToBridgeUseCase;
    private configRepository: NodeConfigRepository;
    private fetchAndInstallRules: FetchAndInstallRulesUseCase;
    private getMissingRulesAgentIds: GetMissingRulesAgentIdsUseCase;
    private notifyMissingRules?: (workspaceRoot: string, missingAgentIds: string[]) => void | Promise<void>;
    private selectActiveAgent?: (workspaceRoot: string) => Promise<string | null>;
    private selectAgentForNewProject?: (workspaceRoot: string) => Promise<string | null>;
    private logger: ILogger | undefined;

    constructor({ statusBar, syncEngine, initializeProject, migrateExistingAgentsToBridge, configRepository, fetchAndInstallRules, getMissingRulesAgentIds, notifyMissingRules, selectActiveAgent, selectAgentForNewProject, logger }: StartSyncOrchestrationProps) {
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

    async execute(options?: { direction?: 'inbound' | 'outbound'; skipAgentSelection?: boolean }): Promise<StartSyncOrchestrationResult> {
        this.statusBar.update(SyncStatus.SYNCING);

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.statusBar.update(SyncStatus.ERROR, 'No workspace folder open');
            return { completed: false };
        }

        const workspaceRoot = workspaceFolders[0]!.uri.fsPath;

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
                await this.fetchAndInstallRules.execute(workspaceRoot, { agentIds: [selectedAgentId] });
                const rulesFile = join(workspaceRoot, '.agents', '.ai', 'rules', `${selectedAgentId}.yaml`);
                if (!existsSync(rulesFile)) {
                    this.statusBar.update(SyncStatus.ERROR, `Reglas faltantes para ${selectedAgentId}`);
                    return { completed: false };
                }
                const migrationResult = await this.migrateExistingAgentsToBridge.execute({ workspaceRoot, selectedAgentId });
                if (migrationResult.migrated.length > 0 && this.logger) {
                    this.logger.info(`Migration: copied ${migrationResult.migrated.map(m => `${m.dir} → .agents`).join(', ')}`);
                }
                if (this.logger) this.logger.info('Project not initialized. Running initialization...');
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
                missingIds = await this.getMissingRulesAgentIds.execute(workspaceRoot, { agentIds: [selectedAgentId] });
                if (missingIds.length > 0 && this.notifyMissingRules) {
                    await this.notifyMissingRules(workspaceRoot, missingIds);
                }
            } catch (err: any) {
                if (this.logger) this.logger.warn('Missing-rules detection or notification failed:', err?.message ?? err);
                else console.warn('Missing-rules detection or notification failed:', err?.message ?? err);
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
        } catch (error: any) {
            if (this.logger) this.logger.error('Sync failed:', error);
            else console.error('Sync failed:', error);
            this.statusBar.update(SyncStatus.ERROR, error.message);
            return { completed: false };
        }
    }
}
