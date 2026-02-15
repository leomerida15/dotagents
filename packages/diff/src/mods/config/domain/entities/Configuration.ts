import { Agent } from './Agent';
import { SyncManifest } from './SyncManifest';

/**
 * Represents the complete project configuration and its current sync state.
 */
export interface ConfigurationProps {
	workspaceRoot: string;
	agents: Agent[];
	manifest: SyncManifest;
}

export class Configuration {
	private workspaceRootPath: string;
	private agentsList: Agent[];
	private syncManifest: SyncManifest;

	constructor({ workspaceRoot, agents, manifest }: ConfigurationProps) {
		this.workspaceRootPath = workspaceRoot;
		this.agentsList = agents;
		this.syncManifest = manifest;
	}

	public static create(props: ConfigurationProps): Configuration {
		if (!props.workspaceRoot) {
			throw new Error('Workspace root is required');
		}
		return new Configuration(props);
	}

	public get workspaceRoot(): string {
		return this.workspaceRootPath;
	}

	public get agents(): Agent[] {
		return [...this.agentsList];
	}

	public get manifest(): SyncManifest {
		return this.syncManifest;
	}

	public addAgent(agent: Agent): void {
		const exists = this.agentsList.find((a) => a.id === agent.id);
		if (!exists) {
			this.agentsList.push(agent);
		}
	}

	public removeAgent(agentId: string): void {
		this.agentsList = this.agentsList.filter((a) => a.id !== agentId);
	}

	/**
	 * Identifies which agents need an outbound pull from the .ai bridge.
	 */
	public getOutdatedAgents(): Agent[] {
		return this.agentsList.filter((agent) => this.syncManifest.needsSync(agent.id));
	}
}
