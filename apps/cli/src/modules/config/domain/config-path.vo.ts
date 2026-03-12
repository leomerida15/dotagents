/**
 * Represents the path to a configuration file.
 * Branded type for type-safety and validation.
 */
export type ConfigPath = string & { readonly __brand: unique symbol };

/**
 * Factory function to create a validated ConfigPath.
 * @param path - The path string to validate
 * @returns A branded ConfigPath
 * @throws Error if path is empty
 */
export function createConfigPath(path: string): ConfigPath {
	if (!path || path.trim() === '') {
		throw new Error('Config path cannot be empty');
	}
	return path as ConfigPath;
}

/**
 * Checks if a value is a valid ConfigPath.
 * @param value - The value to check
 * @returns true if the value is a non-empty string
 */
export function isConfigPath(value: unknown): value is ConfigPath {
	return typeof value === 'string' && value.trim() !== '';
}
