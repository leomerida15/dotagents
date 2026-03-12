// Value Objects
export { createProjectPath, isProjectPath } from './domain/project-path.vo';
export type { ProjectPath } from './domain/project-path.vo';

export { createAgentId, isAgentId } from './domain/agent-id.vo';
export type { AgentId } from './domain/agent-id.vo';

export { createConfigPath, isConfigPath } from './domain/config-path.vo';
export type { ConfigPath } from './domain/config-path.vo';

// Entities
export { createProjectConfig, withActiveAgent } from './domain/project-config.entity';
export type { ProjectConfig, CreateProjectConfigProps } from './domain/project-config.entity';

export {
	createCliPreferences,
	withVerbose,
	withDefaultAgent,
} from './domain/cli-preferences.entity';
export type { CliPreferences, CreateCliPreferencesProps } from './domain/cli-preferences.entity';

// Ports
export type { IConfigRepository } from './domain/config-repository.port';
export type { IPreferencesRepository } from './domain/preferences-repository.port';

// Constants
/** Default CLI preferences file path (~/.dotagents/preferences.json) */
export const DEFAULT_PREFERENCES_PATH = (() => {
	const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '.';
	return `${homeDir}/.dotagents/preferences.json`;
})();

/** Default project config filename */
export const DEFAULT_CONFIG_FILENAME = 'config.yaml';
