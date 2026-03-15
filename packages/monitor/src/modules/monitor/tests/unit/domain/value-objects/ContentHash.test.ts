import { describe, it, expect } from 'bun:test';
import { ContentHash, HashComputationError } from '@monitor/domain/value-objects/ContentHash';

describe('ContentHash', () => {
	describe('compute', () => {
		it('should compute hash from string content', async () => {
			const hash = await ContentHash.compute('hello world');
			expect(hash.value).toBeDefined();
			expect(hash.value.length).toBe(16); // 64-bit hash in hex
			expect(typeof hash.value).toBe('string');
		});

		it('should compute hash from Buffer content', async () => {
			const buffer = Buffer.from('hello world');
			const hash = await ContentHash.compute(buffer);
			expect(hash.value).toBeDefined();
			expect(hash.value.length).toBe(16);
		});

		it('should return consistent hash for same content', async () => {
			const hash1 = await ContentHash.compute('test content');
			const hash2 = await ContentHash.compute('test content');
			expect(hash1.value).toBe(hash2.value);
		});

		it('should return different hashes for different content', async () => {
			const hash1 = await ContentHash.compute('content A');
			const hash2 = await ContentHash.compute('content B');
			expect(hash1.value).not.toBe(hash2.value);
		});

		it('should handle empty string', async () => {
			const hash = await ContentHash.compute('');
			expect(hash.value).toBeDefined();
			expect(hash.value.length).toBe(16);
		});

		it('should handle large content', async () => {
			const largeContent = 'x'.repeat(100000);
			const hash = await ContentHash.compute(largeContent);
			expect(hash.value).toBeDefined();
			expect(hash.value.length).toBe(16);
		});
	});

	describe('fromString', () => {
		it('should create ContentHash from valid hash string', () => {
			const hash = ContentHash.fromString('a1b2c3d4e5f67890');
			expect(hash.value).toBe('a1b2c3d4e5f67890');
		});

		it('should throw for empty string', () => {
			expect(() => ContentHash.fromString('')).toThrow(HashComputationError);
			expect(() => ContentHash.fromString('')).toThrow('Hash must be a non-empty string');
		});

		it('should throw for null/undefined', () => {
			expect(() => ContentHash.fromString(null as unknown as string)).toThrow(
				HashComputationError,
			);
			expect(() => ContentHash.fromString(undefined as unknown as string)).toThrow(
				HashComputationError,
			);
		});
	});

	describe('equals', () => {
		it('should return true for identical hashes', () => {
			const a = ContentHash.fromString('a1b2c3d4e5f67890');
			const b = ContentHash.fromString('a1b2c3d4e5f67890');
			expect(a.equals(b)).toBe(true);
		});

		it('should return false for different hashes', () => {
			const a = ContentHash.fromString('a1b2c3d4e5f67890');
			const b = ContentHash.fromString('0987f6e5d4c3b2a1');
			expect(a.equals(b)).toBe(false);
		});
	});

	describe('toString', () => {
		it('should return hash value', () => {
			const hash = ContentHash.fromString('a1b2c3d4e5f67890');
			expect(hash.toString()).toBe('a1b2c3d4e5f67890');
		});
	});
});
