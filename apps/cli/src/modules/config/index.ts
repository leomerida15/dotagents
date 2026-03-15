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

// Infrastructure
export { YamlConfigRepository } from './infrastructure/yaml-config-repository';
export { JsonPreferencesRepository } from './infrastructure/json-preferences-repository';

// Use Cases
export { loadProjectConfig } from './application/load-project-config.use-case';
export type { LoadProjectConfigParams } from './application/load-project-config.use-case';

export { saveProjectConfig } from './application/save-project-config.use-case';
export type { SaveProjectConfigParams } from './application/save-project-config.use-case';

export { getActiveAgent } from './application/get-active-agent.use-case';
export type { GetActiveAgentParams } from './application/get-active-agent.use-case';

// Constants
export {
	DEFAULT_PREFERENCES_PATH,
	DEFAULT_CONFIG_FILENAME,
	DEFAULT_CONFIG_PATH,
} from './constants';

// Factory
export { createConfigModule } from './config.module';
