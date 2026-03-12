import type { CliPreferences } from './cli-preferences.entity';

/**
 * Output Port: Contract for the CLI preferences repository.
 * Implemented by adapters (e.g., JsonPreferencesRepository).
 */
export interface IPreferencesRepository {
	/**
	 * Loads the CLI preferences from the global preferences file.
	 * @returns The loaded CliPreferences, or default preferences if file doesn't exist
	 */
	load(): Promise<CliPreferences>;

	/**
	 * Saves the CLI preferences to the global preferences file.
	 * @param preferences - The preferences to save
	 * @throws Error if the file cannot be written
	 */
	save(preferences: CliPreferences): Promise<void>;

	/**
	 * Checks if the preferences file exists.
	 * @returns true if the file exists
	 */
	exists(): Promise<boolean>;
}
