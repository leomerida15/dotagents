import type { AgentId } from './agent-id.vo';
import type { ProjectPath } from './project-path.vo';

/**
 * Project configuration loaded from .agents/config.yaml.
 * Contains the active agent and list of configured agents for a project.
 */
export interface ProjectConfig {
	/** Path to the project directory */
	readonly projectPath: ProjectPath;
	/** Currently active agent for this project */
	readonly activeAgent: AgentId;
	/** List of agents configured in the project */
	readonly agents: readonly AgentId[];
	/** Timestamp of last modification */
	readonly lastModified?: Date;
}

/** Props for creating a new ProjectConfig */
export interface CreateProjectConfigProps {
	projectPath: ProjectPath;
	activeAgent: AgentId;
	agents?: AgentId[];
	lastModified?: Date;
}

/**
 * Factory function to create a ProjectConfig.
 * @param props - The configuration properties
 * @returns A new ProjectConfig instance
 */
export function createProjectConfig(props: CreateProjectConfigProps): ProjectConfig {
	return {
		projectPath: props.projectPath,
		activeAgent: props.activeAgent,
		agents: props.agents ?? [props.activeAgent],
		lastModified: props.lastModified ?? new Date(),
	};
}

/**
 * Creates a new ProjectConfig with an updated active agent.
 * @param config - The original config
 * @param newAgent - The new active agent
 * @returns A new ProjectConfig with the updated agent
 */
export function withActiveAgent(config: ProjectConfig, newAgent: AgentId): ProjectConfig {
	const existingAgents = config.agents.includes(newAgent)
		? config.agents
		: [...config.agents, newAgent];

	return {
		...config,
		activeAgent: newAgent,
		agents: existingAgents,
		lastModified: new Date(),
	};
}
