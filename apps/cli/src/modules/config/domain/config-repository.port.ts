import type { ProjectConfig } from './project-config.entity';
import type { ConfigPath } from './config-path.vo';

/**
 * Output Port: Contract for the project configuration repository.
 * Implemented by adapters (e.g., YamlConfigRepository, JsonConfigRepository).
 */
export interface IConfigRepository {
	/**
	 * Loads the project configuration from a file.
	 * @param path - The path to the configuration file
	 * @returns The loaded ProjectConfig
	 * @throws Error if the file cannot be read or parsed
	 */
	load(path: ConfigPath): Promise<ProjectConfig>;

	/**
	 * Saves the project configuration to a file.
	 * @param config - The configuration to save
	 * @param path - The path to the configuration file
	 * @throws Error if the file cannot be written
	 */
	save(config: ProjectConfig, path: ConfigPath): Promise<void>;

	/**
	 * Checks if a configuration file exists.
	 * @param path - The path to check
	 * @returns true if the file exists
	 */
	exists(path: ConfigPath): Promise<boolean>;
}
