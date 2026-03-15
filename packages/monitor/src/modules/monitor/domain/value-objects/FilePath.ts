/**
 * FilePath value object.
 * Represents a validated, normalized absolute file path.
 */

import { isAbsolute, normalize, basename, dirname, extname } from 'node:path';

/**
 * Error thrown when an invalid file path is provided.
 */
export class InvalidPathError extends Error {
	constructor(path: string, reason: string) {
		super(`Invalid path "${path}": ${reason}`);
		this.name = 'InvalidPathError';
	}
}

/**
 * Immutable value object representing a validated file path.
 */
export class FilePath {
	private constructor(private readonly _value: string) {}

	/**
	 * Create a new FilePath from a string.
	 * @param path - The path string to validate and normalize
	 * @returns A new FilePath instance
	 * @throws {InvalidPathError} If path is not absolute or is invalid
	 */
	static create(path: string): FilePath {
		if (!path || typeof path !== 'string') {
			throw new InvalidPathError(String(path), 'Path must be a non-empty string');
		}

		const normalized = normalize(path);

		if (!isAbsolute(normalized)) {
			throw new InvalidPathError(path, 'Path must be absolute');
		}

		return new FilePath(normalized);
	}

	/**
	 * Get the normalized path value.
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * Get the filename (basename) of the path.
	 */
	get basename(): string {
		return basename(this._value);
	}

	/**
	 * Get the directory name of the path.
	 */
	get dirname(): string {
		return dirname(this._value);
	}

	/**
	 * Get the file extension.
	 */
	get extension(): string {
		return extname(this._value);
	}

	/**
	 * Check if this path equals another path.
	 * @param other - Another FilePath to compare
	 */
	equals(other: FilePath): boolean {
		return this._value === other._value;
	}

	/**
	 * Check if this path starts with the given prefix.
	 * @param prefix - Path prefix to check
	 */
	startsWith(prefix: string): boolean {
		return this._value.startsWith(prefix);
	}

	/**
	 * Convert to string (returns the normalized path).
	 */
	toString(): string {
		return this._value;
	}
}
