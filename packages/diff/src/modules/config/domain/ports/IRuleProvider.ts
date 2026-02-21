import type { AgentProps } from '../entities/Agent';

/**
 * Port interface for retrieving the master agent rules from GitHub.
 */
export interface IRuleProvider {
	/**
	 * Fetches the agent definitions (mappings, paths) based on the @dotagents meta-standard.
	 */
	fetchAgentDefinitions(): Promise<AgentProps[]>;

	/**
	 * Fetches the raw content of a specific rule file.
	 */
	fetchRuleRaw(agentId: string): Promise<string>;
}
