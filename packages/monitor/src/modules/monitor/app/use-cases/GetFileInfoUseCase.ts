/**
 * GetFileInfoUseCase - Get metadata for a single file.
 */

import type { IDirectoryScanner } from '../../domain/ports/IDirectoryScanner';
import type { GetFileInfoInput } from '../dto/schemas';
import { FilePath } from '../../domain/value-objects/FilePath';
import { ContentHash } from '../../domain/value-objects/ContentHash';

/**
 * Error thrown when a file is not found.
 */
export class FileNotFoundError extends Error {
	constructor(path: string) {
		super(`File not found: ${path}`);
		this.name = 'FileNotFoundError';
	}
}

/**
 * Output type for GetFileInfoUseCase.
 */
export interface FileMetadata {
	path: string;
	size: number;
	modifiedTime: string;
	contentHash: string;
	isDirectory: boolean;
	isSymlink: boolean;
	targetPath?: string;
}

/**
 * Use case for getting single file metadata.
 */
export class GetFileInfoUseCase {
	constructor(private readonly scanner: IDirectoryScanner) {}

	/**
	 * Execute the use case.
	 * @param input - Validated get file info input
	 * @returns File metadata
	 * @throws {FileNotFoundError} If file does not exist
	 */
	async execute(input: GetFileInfoInput): Promise<FileMetadata> {
		// Scan parent directory to get file info
		const filePath = FilePath.create(input.path);
		const parentDir = filePath.dirname;

		const snapshots = await this.scanner.scan({
			path: parentDir,
			recursive: false,
			respectGitignore: false,
		});

		const snapshot = snapshots.find((s) => s.path.value === input.path);

		if (!snapshot) {
			throw new FileNotFoundError(input.path);
		}

		return {
			path: snapshot.path.value,
			size: snapshot.size,
			modifiedTime: snapshot.modifiedAt.toISOString(),
			contentHash: snapshot.contentHash.value,
			isDirectory: snapshot.isDirectory,
			isSymlink: snapshot.isSymlink,
			targetPath: snapshot.targetPath,
		};
	}

	/**
	 * Compute hash for a file directly.
	 * @param filePath - Path to the file
	 * @returns Content hash
	 */
	async computeHash(filePath: string): Promise<string> {
		const file = Bun.file(filePath);
		const content = await file.arrayBuffer();
		const hash = await ContentHash.compute(Buffer.from(content));
		return hash.value;
	}
}
