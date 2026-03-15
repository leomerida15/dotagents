import { describe, it, expect, beforeEach } from 'bun:test';
import {
	ListFilesUseCase,
	FileNotFoundError,
	PermissionDeniedError,
} from '@monitor/app/use-cases/ListFilesUseCase';
import { FileSnapshot } from '@monitor/domain/entities/FileSnapshot';
import { FilePath } from '@monitor/domain/value-objects/FilePath';
import { ContentHash } from '@monitor/domain/value-objects/ContentHash';
import type { IDirectoryScanner, ScanOptions } from '@monitor/domain/ports/IDirectoryScanner';
import type { ListDirectoryInput } from '@monitor/app/dto/schemas';

// Mock IDirectoryScanner
class MockDirectoryScanner implements IDirectoryScanner {
	scanResults: FileSnapshot[] = [];
	shouldThrowENOENT = false;
	shouldThrowEACCES = false;

	async scan(_options: ScanOptions): Promise<FileSnapshot[]> {
		if (this.shouldThrowENOENT) {
			const error = new Error('ENOENT: no such file or directory');
			throw error;
		}
		if (this.shouldThrowEACCES) {
			const error = new Error('EACCES: permission denied');
			throw error;
		}
		return this.scanResults;
	}
}

describe('ListFilesUseCase', () => {
	let useCase: ListFilesUseCase;
	let mockScanner: MockDirectoryScanner;

	beforeEach(() => {
		mockScanner = new MockDirectoryScanner();
		useCase = new ListFilesUseCase(mockScanner);
	});

	describe('execute', () => {
		it('should return file info for scanned files', async () => {
			mockScanner.scanResults = [
				FileSnapshot.create({
					path: FilePath.create('/home/user/file.ts'),
					size: 1024,
					modifiedAt: new Date('2024-01-15T10:30:00Z'),
					contentHash: ContentHash.fromString('a1b2c3d4e5f67890'),
					isDirectory: false,
					isSymlink: false,
				}),
			];

			const input: ListDirectoryInput = {
				path: '/home/user',
				recursive: false,
				include: [],
				exclude: [],
				respectGitignore: true,
				followSymlinks: false,
			};

			const result = await useCase.execute(input);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('file.ts');
			expect(result[0].path).toBe('/home/user/file.ts');
			expect(result[0].type).toBe('file');
			expect(result[0].size).toBe(1024);
			expect(result[0].contentHash).toBe('a1b2c3d4e5f67890');
		});

		it('should handle directories', async () => {
			mockScanner.scanResults = [
				FileSnapshot.create({
					path: FilePath.create('/home/user/project'),
					size: 0,
					modifiedAt: new Date('2024-01-15T10:30:00Z'),
					contentHash: ContentHash.fromString('directory'),
					isDirectory: true,
					isSymlink: false,
				}),
			];

			const result = await useCase.execute({
				path: '/home/user',
				recursive: false,
			} as ListDirectoryInput);

			expect(result[0].type).toBe('directory');
			expect(result[0].contentHash).toBeUndefined();
		});

		it('should handle symlinks', async () => {
			mockScanner.scanResults = [
				FileSnapshot.create({
					path: FilePath.create('/home/user/link'),
					size: 0,
					modifiedAt: new Date('2024-01-15T10:30:00Z'),
					contentHash: ContentHash.fromString('symlink'),
					isDirectory: false,
					isSymlink: true,
					targetPath: '/path/to/target',
				}),
			];

			const result = await useCase.execute({
				path: '/home/user',
				recursive: false,
			} as ListDirectoryInput);

			expect(result[0].type).toBe('symlink');
		});

		it('should pass options to scanner', async () => {
			let capturedOptions: ScanOptions | undefined;
			mockScanner.scan = async (options: ScanOptions) => {
				capturedOptions = options;
				return [];
			};

			await useCase.execute({
				path: '/home/user',
				recursive: true,
				include: ['**/*.ts'],
				exclude: ['**/node_modules/**'],
				respectGitignore: false,
				maxDepth: 3,
			} as ListDirectoryInput);

			expect(capturedOptions).toMatchObject({
				path: '/home/user',
				recursive: true,
				include: ['**/*.ts'],
				exclude: ['**/node_modules/**'],
				respectGitignore: false,
				maxDepth: 3,
			});
		});

		it('should throw FileNotFoundError for ENOENT', async () => {
			mockScanner.shouldThrowENOENT = true;

			await expect(
				useCase.execute({
					path: '/nonexistent',
					recursive: false,
				} as ListDirectoryInput),
			).rejects.toThrow(FileNotFoundError);
		});

		it('should throw PermissionDeniedError for EACCES', async () => {
			mockScanner.shouldThrowEACCES = true;

			await expect(
				useCase.execute({
					path: '/root/secret',
					recursive: false,
				} as ListDirectoryInput),
			).rejects.toThrow(PermissionDeniedError);
		});

		it('should return empty array for empty directory', async () => {
			mockScanner.scanResults = [];

			const result = await useCase.execute({
				path: '/home/user/empty',
				recursive: false,
			} as ListDirectoryInput);

			expect(result).toHaveLength(0);
		});
	});
});
