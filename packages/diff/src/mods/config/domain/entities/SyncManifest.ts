/**
 * Represents the synchronization state of the project.
 * Manages timestamps to determine which agents need updates.
 */
export interface SyncManifestProps {
    lastProcessedAt: number;
    lastActiveAgent: string;
    agents: Record<string, number>; // agentId -> timestamp
}

export class SyncManifest {
    private lastProcessedAtValue: number;
    private lastActiveAgentId: string;
    private agentTimestamps: Record<string, number>;

    constructor({ lastProcessedAt, lastActiveAgent, agents }: SyncManifestProps) {
        this.lastProcessedAtValue = lastProcessedAt;
        this.lastActiveAgentId = lastActiveAgent;
        this.agentTimestamps = agents;
    }

    public static create(props: SyncManifestProps): SyncManifest {
        return new SyncManifest(props);
    }

    /**
     * Creates an empty manifest for a new project.
     */
    public static createEmpty(): SyncManifest {
        return new SyncManifest({
            lastProcessedAt: 0,
            lastActiveAgent: 'none',
            agents: {
                ai: 0
            }
        });
    }

    public get lastProcessedAt(): number {
        return this.lastProcessedAtValue;
    }

    public get lastActiveAgent(): string {
        return this.lastActiveAgentId;
    }

    /**
     * Checks if a specific agent is out of sync with the .ai bridge.
     */
    public needsSync(agentId: string): boolean {
        const aiTimestamp = this.agentTimestamps['ai'] || 0;
        const agentTimestamp = this.agentTimestamps[agentId] || 0;

        // If .ai is newer than the agent, the agent needs an outbound sync.
        return aiTimestamp > agentTimestamp;
    }

    /**
     * Updates the timestamp for an agent and the central .ai bridge.
     */
    public markAsSynced(agentId: string): void {
        const now = Date.now();
        this.lastProcessedAtValue = now;
        this.lastActiveAgentId = agentId;
        this.agentTimestamps[agentId] = now;
        this.agentTimestamps['ai'] = now;
    }

    public getAgentTimestamp(agentId: string): number {
        return this.agentTimestamps[agentId] || 0;
    }

    public toJSON(): SyncManifestProps {
        return {
            lastProcessedAt: this.lastProcessedAtValue,
            lastActiveAgent: this.lastActiveAgentId,
            agents: { ...this.agentTimestamps }
        };
    }
}
