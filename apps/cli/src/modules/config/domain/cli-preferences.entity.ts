import type { AgentId } from './agent-id.vo';

/**
 * Global CLI preferences stored in ~/.dotagents/preferences.json.
 * Contains user-level settings that apply across all projects.
 */
export interface CliPreferences {
	/** Default active agent (used when no project config exists) */
	readonly defaultAgent?: AgentId;
	/** Enable verbose/debug output */
	readonly verbose: boolean;
	/** Path to the daemon log file */
	readonly daemonLogPath?: string;
}

/** Props for creating CliPreferences */
export interface CreateCliPreferencesProps {
	defaultAgent?: AgentId;
	verbose?: boolean;
	daemonLogPath?: string;
}

/**
 * Factory function to create CliPreferences.
 * @param props - The preferences properties
 * @returns A new CliPreferences instance
 */
export function createCliPreferences(props: CreateCliPreferencesProps = {}): CliPreferences {
	return {
		defaultAgent: props.defaultAgent,
		verbose: props.verbose ?? false,
		daemonLogPath: props.daemonLogPath,
	};
}

/**
 * Creates new CliPreferences with updated verbose setting.
 * @param preferences - The original preferences
 * @param verbose - The new verbose value
 * @returns A new CliPreferences with the updated verbose setting
 */
export function withVerbose(preferences: CliPreferences, verbose: boolean): CliPreferences {
	return {
		...preferences,
		verbose,
	};
}

/**
 * Creates new CliPreferences with updated default agent.
 * @param preferences - The original preferences
 * @param agent - The new default agent
 * @returns A new CliPreferences with the updated default agent
 */
export function withDefaultAgent(preferences: CliPreferences, agent: AgentId): CliPreferences {
	return {
		...preferences,
		defaultAgent: agent,
	};
}
