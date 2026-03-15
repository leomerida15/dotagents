import { describe, it, expect } from 'bun:test';
import { GitInfo, InvalidGitInfoError } from '@monitor/domain/value-objects/GitInfo';

describe('GitInfo', () => {
	describe('create', () => {
		it('should create GitInfo with all properties', () => {
			const gitInfo = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'feature/monitor',
				isClean: true,
			});

			expect(gitInfo.commitHash).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
			expect(gitInfo.branch).toBe('feature/monitor');
			expect(gitInfo.isClean).toBe(true);
			expect(gitInfo.isValid).toBe(true);
		});

		it('should handle null values for non-git directory', () => {
			const gitInfo = GitInfo.create({
				commitHash: null,
				branch: null,
				isClean: null,
			});

			expect(gitInfo.commitHash).toBeNull();
			expect(gitInfo.branch).toBeNull();
			expect(gitInfo.isClean).toBeNull();
			expect(gitInfo.isValid).toBe(false);
		});

		it('should throw for invalid commit hash length', () => {
			expect(() =>
				GitInfo.create({
					commitHash: 'short',
					branch: 'main',
					isClean: true,
				}),
			).toThrow(InvalidGitInfoError);
			expect(() =>
				GitInfo.create({
					commitHash: 'short',
					branch: 'main',
					isClean: true,
				}),
			).toThrow('Commit hash must be 40 characters');
		});

		it('should accept 40-character commit hash', () => {
			const validHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
			expect(() =>
				GitInfo.create({
					commitHash: validHash,
					branch: 'main',
					isClean: true,
				}),
			).not.toThrow();
		});
	});

	describe('none', () => {
		it('should create invalid GitInfo for non-git directory', () => {
			const gitInfo = GitInfo.none();

			expect(gitInfo.commitHash).toBeNull();
			expect(gitInfo.branch).toBeNull();
			expect(gitInfo.isClean).toBeNull();
			expect(gitInfo.isValid).toBe(false);
		});
	});

	describe('equals', () => {
		it('should return true for identical GitInfo', () => {
			const a = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			const b = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			expect(a.equals(b)).toBe(true);
		});

		it('should return false for different commit hash', () => {
			const a = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			const b = GitInfo.create({
				commitHash: 'b1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			expect(a.equals(b)).toBe(false);
		});

		it('should return false for different branch', () => {
			const a = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			const b = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'develop',
				isClean: true,
			});
			expect(a.equals(b)).toBe(false);
		});

		it('should return false for different clean status', () => {
			const a = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: true,
			});
			const b = GitInfo.create({
				commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
				branch: 'main',
				isClean: false,
			});
			expect(a.equals(b)).toBe(false);
		});
	});
});
