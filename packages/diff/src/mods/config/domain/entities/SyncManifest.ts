import { AgentTimestamp } from '../value-objects/AgentTimestamp';

/**
 * Represents the synchronization state of the project.
 * Manages timestamps to determine which agents need updates.
 */
export interface SyncManifestProps {
	lastProcessedAt: number;
	lastActiveAgent: string;
	currentAgent: string | null;
	agents: Record<string, AgentTimestamp>; // agentId -> AgentTimestamp
}

export class SyncManifest {
	private lastProcessedAtValue: number;
	private lastActiveAgentId: string;
	private currentAgentId: string | null;
	private agentTimestamps: Record<string, AgentTimestamp>;

	constructor({ lastProcessedAt, lastActiveAgent, currentAgent, agents }: SyncManifestProps) {
		this.lastProcessedAtValue = lastProcessedAt;
		this.lastActiveAgentId = lastActiveAgent;
		this.currentAgentId = currentAgent;
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
			currentAgent: null,
			agents: {},
		});
	}

	public get lastProcessedAt(): number {
		return this.lastProcessedAtValue;
	}

	public get lastActiveAgent(): string {
		return this.lastActiveAgentId;
	}

	/**
	 * Gets the current active agent.
	 * @returns The current agent ID or null if none is active
	 */
	public get currentAgent(): string | null {
		return this.currentAgentId;
	}

	/**
	 * Sets the current active agent.
	 * @param agentId - The agent ID to set as current, or null to clear
	 */
	public setCurrentAgent(agentId: string | null): void {
		this.currentAgentId = agentId;
	}

	/**
	 * Checks if a specific agent is out of sync with the .agents bridge.
	 * @param agentId - The agent ID to check
	 * @returns true if the agent needs synchronization
	 */
	public needsSync(agentId: string): boolean {
		const bridgeTimestamp = this.agentTimestamps['agents']?.lastProcessedAt || 0;
		const agentTimestamp = this.agentTimestamps[agentId]?.lastProcessedAt || 0;

		// If .agents is newer than the agent, the agent needs an outbound sync.
		return bridgeTimestamp > agentTimestamp;
	}

	/**
	 * Updates the timestamp for an agent and the central .agents bridge.
	 * The timestamp of the bridge matches the timestamp of the active agent.
	 * @param agentId - The agent ID that was synchronized
	 */
	public markAsSynced(agentId: string): void {
		const now = Date.now();
		const timestamp = { lastProcessedAt: now };

		this.lastProcessedAtValue = now;
		this.lastActiveAgentId = agentId;
		this.currentAgentId = agentId;

		// Set timestamp for the specific agent
		this.agentTimestamps[agentId] = AgentTimestamp.create(timestamp);

		// The bridge timestamp must match the active agent's timestamp
		this.agentTimestamps['agents'] = AgentTimestamp.create(timestamp);
	}

	/**
	 * Gets the timestamp for a specific agent.
	 * @param agentId - The agent ID to query
	 * @returns The timestamp in milliseconds, or 0 if not found
	 */
	public getAgentTimestamp(agentId: string): number {
		return this.agentTimestamps[agentId]?.lastProcessedAt || 0;
	}

	/**
	 * Registers a new agent in the manifest if it doesn't exist.
	 * @param agentId - The agent ID to register.
	 */
	public registerAgent(agentId: string): void {
		if (!this.agentTimestamps[agentId]) {
			this.agentTimestamps[agentId] = AgentTimestamp.create({ lastProcessedAt: 0 });
		}
	}

	/**
	 * Serializes the manifest to JSON format.
	 * @returns Plain object representation suitable for persistence
	 */
	public toJSON(): any {
		return {
			lastProcessedAt: this.lastProcessedAtValue,
			lastActiveAgent: this.lastActiveAgentId,
			currentAgent: this.currentAgentId,
			agents: Object.fromEntries(
				Object.entries(this.agentTimestamps).map(([key, timestamp]) => [
					key,
					timestamp.toJSON(),
				])
			),
		};
	}
}
