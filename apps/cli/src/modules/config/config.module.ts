import type { IConfigRepository } from './domain/config-repository.port';
import type { IPreferencesRepository } from './domain/preferences-repository.port';
import { YamlConfigRepository } from './infrastructure/yaml-config-repository';
import { JsonPreferencesRepository } from './infrastructure/json-preferences-repository';
import { loadProjectConfig } from './application/load-project-config.use-case';
import type { LoadProjectConfigParams } from './application/load-project-config.use-case';
import { saveProjectConfig } from './application/save-project-config.use-case';
import type { SaveProjectConfigParams } from './application/save-project-config.use-case';
import { getActiveAgent } from './application/get-active-agent.use-case';
import type { GetActiveAgentParams } from './application/get-active-agent.use-case';
import { DEFAULT_PREFERENCES_PATH } from './constants';

export interface ConfigModuleOptions {
	preferencesPath?: string;
}

export interface ConfigModuleUseCases {
	loadProjectConfig: (params: LoadProjectConfigParams) => ReturnType<typeof loadProjectConfig>;
	saveProjectConfig: (params: SaveProjectConfigParams) => ReturnType<typeof saveProjectConfig>;
	getActiveAgent: (params: GetActiveAgentParams) => ReturnType<typeof getActiveAgent>;
}

export interface ConfigModule {
	configRepository: IConfigRepository;
	preferencesRepository: IPreferencesRepository;
	useCases: ConfigModuleUseCases;
}

/**
 * Creates a new Config module with all dependencies wired up.
 * @param options - Configuration options
 * @returns The Config module with repositories and use cases
 */
export function createConfigModule(options: ConfigModuleOptions = {}): ConfigModule {
	const preferencesPath = options.preferencesPath ?? DEFAULT_PREFERENCES_PATH;

	const configRepository = new YamlConfigRepository();
	const preferencesRepository = new JsonPreferencesRepository({ filePath: preferencesPath });

	const useCases: ConfigModuleUseCases = {
		loadProjectConfig,
		saveProjectConfig,
		getActiveAgent,
	};

	return {
		configRepository,
		preferencesRepository,
		useCases,
	};
}
