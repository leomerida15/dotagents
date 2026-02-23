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
     * @returns Paths written by the sync (for IgnoredPathsRegistry).
     */
    syncAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<{ writtenPaths: string[] }>;

    /**
     * Syncs outbound from .agents bridge to the agent's folder.
     * @param workspaceRoot Root path of the current workspace.
     * @param agentId Agent ID to sync outbound.
     * @param affectedPaths Optional list of absolute paths to sync incrementally.
     * @returns Paths written by the sync (for IgnoredPathsRegistry).
     */
    syncOutboundAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<{ writtenPaths: string[] }>;

    /**
     * Sync new: full bidirectional sync (.agents -> IDE, then IDE -> .agents).
     * For use when changing tools; caller must add writtenPaths to IgnoredPathsRegistry and set cooldowns.
     * @param workspaceRoot Root path of the current workspace.
     * @param agentId Agent ID to sync.
     * @returns Paths written by both syncs (for IgnoredPathsRegistry).
     */
    syncNew(workspaceRoot: string, agentId: string): Promise<{ writtenPaths: string[] }>;
}
