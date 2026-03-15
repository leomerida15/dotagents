import { describe, it, expect, beforeEach } from 'bun:test';
import { GetFileInfoUseCase, FileNotFoundError } from '@monitor/app/use-cases/GetFileInfoUseCase';
import { FileSnapshot } from '@monitor/domain/entities/FileSnapshot';
import { FilePath } from '@monitor/domain/value-objects/FilePath';
import { ContentHash } from '@monitor/domain/value-objects/ContentHash';
import type { IDirectoryScanner, ScanOptions } from '@monitor/domain/ports/IDirectoryScanner';
import type { GetFileInfoInput } from '@monitor/app/dto/schemas';

// Mock IDirectoryScanner
class MockDirectoryScanner implements IDirectoryScanner {
	scanResults: FileSnapshot[] = [];

	async scan(_options: ScanOptions): Promise<FileSnapshot[]> {
		return this.scanResults;
	}
}

describe('GetFileInfoUseCase', () => {
	let useCase: GetFileInfoUseCase;
	let mockScanner: MockDirectoryScanner;

	beforeEach(() => {
		mockScanner = new MockDirectoryScanner();
		useCase = new GetFileInfoUseCase(mockScanner);
	});

	describe('execute', () => {
		it('should return file metadata for existing file', async () => {
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

			const input: GetFileInfoInput = {
				path: '/home/user/file.ts',
			};

			const result = await useCase.execute(input);

			expect(result.path).toBe('/home/user/file.ts');
			expect(result.size).toBe(1024);
			expect(result.contentHash).toBe('a1b2c3d4e5f67890');
			expect(result.isDirectory).toBe(false);
			expect(result.isSymlink).toBe(false);
		});

		it('should return metadata for symlink', async () => {
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
				path: '/home/user/link',
			} as GetFileInfoInput);

			expect(result.isSymlink).toBe(true);
			expect(result.targetPath).toBe('/path/to/target');
		});

		it('should return metadata for directory', async () => {
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
				path: '/home/user/project',
			} as GetFileInfoInput);

			expect(result.isDirectory).toBe(true);
		});

		it('should throw FileNotFoundError when file does not exist', async () => {
			mockScanner.scanResults = [];

			await expect(
				useCase.execute({
					path: '/home/user/nonexistent.ts',
				} as GetFileInfoInput),
			).rejects.toThrow(FileNotFoundError);
		});

		it('should scan parent directory to find file', async () => {
			let capturedPath: string | undefined;
			mockScanner.scan = async (options: ScanOptions) => {
				capturedPath = options.path;
				return [
					FileSnapshot.create({
						path: FilePath.create('/home/user/nested/file.ts'),
						size: 512,
						modifiedAt: new Date(),
						contentHash: ContentHash.fromString('abc123'),
						isDirectory: false,
						isSymlink: false,
					}),
				];
			};

			await useCase.execute({
				path: '/home/user/nested/file.ts',
			} as GetFileInfoInput);

			expect(capturedPath).toBe('/home/user/nested');
		});
	});
});
