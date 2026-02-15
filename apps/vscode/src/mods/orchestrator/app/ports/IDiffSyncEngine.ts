/**
 * Port for the synchronization engine used by the orchestrator.
 */
export interface IDiffSyncEngine {
    /**
     * Synchronizes all active agents in the workspace.
     * @param workspaceRoot Root path of the current workspace.
     */
    syncAll(workspaceRoot: string): Promise<void>;
}
