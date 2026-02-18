import { SyncStatus } from '../domain/SyncState';
import { IDiffSyncEngine } from './ports/IDiffSyncEngine';
import * as vscode from 'vscode';
import { NodeConfigRepository } from '../infra/NodeConfigRepository';
import { InitializeProjectUseCase } from '@dotagents/diff';
import { FetchAndInstallRulesUseCase } from './FetchAndInstallRulesUseCase';

export interface StartSyncOrchestrationProps {
    statusBar: { update: (status: SyncStatus, message?: string) => void };
    syncEngine: IDiffSyncEngine;
    initializeProject: InitializeProjectUseCase;
    configRepository: NodeConfigRepository;
    fetchAndInstallRules: FetchAndInstallRulesUseCase;
}

export class StartSyncOrchestration {
    private statusBar: { update: (status: SyncStatus, message?: string) => void };
    private syncEngine: IDiffSyncEngine;
    private initializeProject: InitializeProjectUseCase;
    private configRepository: NodeConfigRepository;
    private fetchAndInstallRules: FetchAndInstallRulesUseCase;

    constructor({ statusBar, syncEngine, initializeProject, configRepository, fetchAndInstallRules }: StartSyncOrchestrationProps) {
        this.statusBar = statusBar;
        this.syncEngine = syncEngine;
        this.initializeProject = initializeProject;
        this.configRepository = configRepository;
        this.fetchAndInstallRules = fetchAndInstallRules;
    }

    async execute() {
        this.statusBar.update(SyncStatus.SYNCING);

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.statusBar.update(SyncStatus.ERROR, 'No workspace folder open');
            return;
        }

        const workspaceRoot = workspaceFolders[0]!.uri.fsPath;

        try {
            // 1. Check if project is initialized
            const exists = await this.configRepository.exists(workspaceRoot);

            if (!exists) {
                console.log('Project not initialized. Running initialization...');
                await this.initializeProject.execute({ workspaceRoot, force: false });
                console.log('Initialization complete.');
            } else {
                // Ensure .ai exists for projects initialized before this was added
                await this.configRepository.ensureAIStructure(workspaceRoot);
            }

            // 2. Fetch and install rules from GitHub for detected agents
            await this.fetchAndInstallRules.execute(workspaceRoot);

            // 3. Perform Sync
            await this.syncEngine.syncAll(workspaceRoot);
            this.statusBar.update(SyncStatus.SYNCED);
        } catch (error: any) {
            console.error('Sync failed:', error);
            this.statusBar.update(SyncStatus.ERROR, error.message);
        }
    }
}
