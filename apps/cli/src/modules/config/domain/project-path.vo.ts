/**
 * Represents the absolute path to the project directory.
 * Branded type for type-safety and validation.
 */
export type ProjectPath = string & { readonly __brand: unique symbol };

/**
 * Factory function to create a validated ProjectPath.
 * @param path - The path string to validate
 * @returns A branded ProjectPath
 * @throws Error if path is empty or invalid
 */
export function createProjectPath(path: string): ProjectPath {
	if (!path || path.trim() === '') {
		throw new Error('Project path cannot be empty');
	}
	return path as ProjectPath;
}

/**
 * Checks if a value is a valid ProjectPath.
 * @param value - The value to check
 * @returns true if the value is a non-empty string
 */
export function isProjectPath(value: unknown): value is ProjectPath {
	return typeof value === 'string' && value.trim() !== '';
}
