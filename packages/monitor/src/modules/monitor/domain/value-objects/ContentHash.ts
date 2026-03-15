/**
 * ContentHash value object.
 * Represents a computed hash of file content using Bun.hash().
 */

/**
 * Error thrown when hash computation fails.
 */
export class HashComputationError extends Error {
	constructor(message: string) {
		super(`Hash computation failed: ${message}`);
		this.name = 'HashComputationError';
	}
}

/**
 * Immutable value object representing a content hash.
 */
export class ContentHash {
	private constructor(private readonly _value: string) {}

	/**
	 * Compute a hash from file content.
	 * @param content - The content to hash (Buffer or string)
	 * @returns A new ContentHash instance
	 * @throws {HashComputationError} If computation fails
	 */
	static async compute(content: Buffer | string): Promise<ContentHash> {
		try {
			// Use Bun.hash for high-performance hashing
			const hashValue = Bun.hash(content);
			// Convert to hex string (16 characters for 64-bit hash)
			const hashHex = hashValue.toString(16).padStart(16, '0');
			return new ContentHash(hashHex);
		} catch (error) {
			throw new HashComputationError(
				error instanceof Error ? error.message : 'Unknown error',
			);
		}
	}

	/**
	 * Create a ContentHash from an existing hash string.
	 * @param hash - The hash string
	 * @returns A new ContentHash instance
	 */
	static fromString(hash: string): ContentHash {
		if (!hash || typeof hash !== 'string') {
			throw new HashComputationError('Hash must be a non-empty string');
		}
		return new ContentHash(hash);
	}

	/**
	 * Get the hash value.
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * Check if this hash equals another hash.
	 * @param other - Another ContentHash to compare
	 */
	equals(other: ContentHash): boolean {
		return this._value === other._value;
	}

	/**
	 * Convert to string (returns the hash value).
	 */
	toString(): string {
		return this._value;
	}
}
