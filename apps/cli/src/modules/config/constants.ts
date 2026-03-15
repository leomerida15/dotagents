/**
 * Default CLI preferences file path (~/.dotagents/preferences.json).
 * Computed at runtime based on the user's home directory.
 */
export const DEFAULT_PREFERENCES_PATH = (() => {
	const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '.';
	return `${homeDir}/.dotagents/preferences.json`;
})();

/** Default project config filename */
export const DEFAULT_CONFIG_FILENAME = 'config.yaml';

/** Default project config path relative to project root */
export const DEFAULT_CONFIG_PATH = '.agents/config.yaml';
