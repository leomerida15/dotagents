import { Configuration } from '../entities/Configuration';

/**
 * Port interface for loading and saving the configuration.
 */
export interface IConfigRepository {
	/**
	 * Saves the current project configuration.
	 * @param config - The configuration to save.
	 */
	save(config: Configuration): Promise<void>;

	/**
	 * Loads the configuration for the current project.
	 * @param workspaceRoot - The workspace root to load from.
	 * @returns The loaded configuration.
	 */
	load(workspaceRoot: string): Promise<Configuration>;
}
