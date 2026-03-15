import type { IConfigRepository } from '../domain/config-repository.port';
import type { ProjectConfig } from '../domain/project-config.entity';
import type { ConfigPath } from '../domain/config-path.vo';
import { createConfigPath } from '../domain/config-path.vo';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DEFAULT_CONFIG_PATH } from '../constants';

export interface SaveProjectConfigParams {
	configRepository: IConfigRepository;
	config: ProjectConfig;
	configPath?: ConfigPath;
}

/**
 * Saves the project configuration to a file.
 * If no configPath is provided, derives it from the project's .agents/config.yaml path.
 * Creates the directory if it does not exist.
 * @param params - The parameters for saving project config
 * @throws Error if the config is invalid or cannot be saved
 */
export async function saveProjectConfig(params: SaveProjectConfigParams): Promise<void> {
	const { configRepository, config } = params;

	const configPath =
		params.configPath ??
		createConfigPath(`${config.projectPath as string}/${DEFAULT_CONFIG_PATH}`);

	const configPathStr = configPath as string;
	const dir = dirname(configPathStr);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	await configRepository.save(config, configPath);
}
