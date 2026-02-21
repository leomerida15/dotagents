/**
 * Port for the synchronization engine used by the orchestrator.
 */
export interface IDiffSyncEngine {
    /**
     * Synchronizes all active agents in the workspace.
     * @param workspaceRoot Root path of the current workspace.
     */
    syncAll(workspaceRoot: string): Promise<void>;

    /**
     * Synchronizes a single agent in the workspace (inbound: IDE -> .agents).
     * @param workspaceRoot Root path of the current workspace.
     * @param agentId Agent ID to synchronize.
     * @param affectedPaths Optional list of absolute paths to sync incrementally.
     */
    syncAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<void>;

    /**
     * Syncs outbound from .agents bridge to the agent's folder.
     * @param workspaceRoot Root path of the current workspace.
     * @param agentId Agent ID to sync outbound.
     * @param affectedPaths Optional list of absolute paths to sync incrementally.
     */
    syncOutboundAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<void>;
}
