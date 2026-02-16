import { SyncStatus } from '../domain/SyncState';
import { IDiffSyncEngine } from './ports/IDiffSyncEngine';
import * as vscode from 'vscode';
import { NodeConfigRepository } from '../infra/NodeConfigRepository';
import { InitializeProjectUseCase } from '@dotagents/diff';

export interface StartSyncOrchestrationProps {
    statusBar: { update: (status: SyncStatus, message?: string) => void };
    syncEngine: IDiffSyncEngine;
    initializeProject: InitializeProjectUseCase;
    configRepository: NodeConfigRepository;
}

export class StartSyncOrchestration {
    private statusBar: { update: (status: SyncStatus, message?: string) => void };
    private syncEngine: IDiffSyncEngine;
    private initializeProject: InitializeProjectUseCase;
    private configRepository: NodeConfigRepository;

    constructor({ statusBar, syncEngine, initializeProject, configRepository }: StartSyncOrchestrationProps) {
        this.statusBar = statusBar;
        this.syncEngine = syncEngine;
        this.initializeProject = initializeProject;
        this.configRepository = configRepository;
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
            }

            // 2. Perform Sync
            await this.syncEngine.syncAll(workspaceRoot);
            this.statusBar.update(SyncStatus.SYNCED);
        } catch (error: any) {
            console.error('Sync failed:', error);
            this.statusBar.update(SyncStatus.ERROR, error.message);
        }
    }
}
