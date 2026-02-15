import { SyncStatus } from '../domain/SyncState';
import { IDiffSyncEngine } from './ports/IDiffSyncEngine';
import * as vscode from 'vscode';

export interface StartSyncOrchestrationProps {
    statusBar: { update: (status: SyncStatus, message?: string) => void };
    syncEngine: IDiffSyncEngine;
}

export class StartSyncOrchestration {
    private statusBar: { update: (status: SyncStatus, message?: string) => void };
    private syncEngine: IDiffSyncEngine;

    constructor({ statusBar, syncEngine }: StartSyncOrchestrationProps) {
        this.statusBar = statusBar;
        this.syncEngine = syncEngine;
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
            await this.syncEngine.syncAll(workspaceRoot);
            this.statusBar.update(SyncStatus.SYNCED);
        } catch (error: any) {
            console.error('Sync failed:', error);
            this.statusBar.update(SyncStatus.ERROR, error.message);
        }
    }
}
