import type { IConfigRepository } from '../domain/config-repository.port';
import type { ProjectConfig } from '../domain/project-config.entity';
import type { ProjectPath } from '../domain/project-path.vo';
import type { ConfigPath } from '../domain/config-path.vo';
import { createConfigPath } from '../domain/config-path.vo';
import { DEFAULT_CONFIG_PATH } from '../constants';

export interface LoadProjectConfigParams {
	configRepository: IConfigRepository;
	projectPath: ProjectPath;
	configPath?: ConfigPath;
}

/**
 * Loads the project configuration from a project path.
 * Derives the config path from the project path using the .agents/config.yaml convention,
 * or uses the provided configPath if specified.
 * @param params - The parameters for loading project config
 * @returns The loaded ProjectConfig, or null if no config exists
 * @throws Error if the config file exists but is invalid
 */
export async function loadProjectConfig(
	params: LoadProjectConfigParams,
): Promise<ProjectConfig | null> {
	const { configRepository, projectPath, configPath: providedConfigPath } = params;

	const configPath =
		providedConfigPath ?? createConfigPath(`${projectPath as string}/${DEFAULT_CONFIG_PATH}`);

	const exists = await configRepository.exists(configPath);
	if (!exists) {
		return null;
	}

	return await configRepository.load(configPath);
}
