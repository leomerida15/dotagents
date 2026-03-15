/**
 * ListFilesUseCase - List directory contents with metadata.
 */

import type { IDirectoryScanner } from '../../domain/ports/IDirectoryScanner';
import type { ListDirectoryInput } from '../dto/schemas';
import type { FileSnapshot } from '../../domain/entities/FileSnapshot';

/**
 * Error thrown when a file is not found.
 */
export class FileNotFoundError extends Error {
	constructor(path: string) {
		super(`File or directory not found: ${path}`);
		this.name = 'FileNotFoundError';
	}
}

/**
 * Error thrown when permission is denied.
 */
export class PermissionDeniedError extends Error {
	constructor(path: string) {
		super(`Permission denied: ${path}`);
		this.name = 'PermissionDeniedError';
	}
}

/**
 * Output type for ListFilesUseCase.
 */
export interface FileInfo {
	name: string;
	path: string;
	type: 'file' | 'directory' | 'symlink';
	size: number;
	modifiedTime: string;
	contentHash?: string;
}

/**
 * Use case for listing directory contents.
 */
export class ListFilesUseCase {
	constructor(private readonly scanner: IDirectoryScanner) {}

	/**
	 * Execute the use case.
	 * @param input - Validated list directory input
	 * @returns Array of file information objects
	 * @throws {FileNotFoundError} If path does not exist
	 * @throws {PermissionDeniedError} If path is not readable
	 */
	async execute(input: ListDirectoryInput): Promise<FileInfo[]> {
		try {
			const snapshots = await this.scanner.scan({
				path: input.path,
				recursive: input.recursive,
				include: input.include,
				exclude: input.exclude,
				respectGitignore: input.respectGitignore,
				followSymlinks: input.followSymlinks,
				maxDepth: input.maxDepth,
			});

			return snapshots.map((snapshot) => this.mapToFileInfo(snapshot));
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('ENOENT')) {
					throw new FileNotFoundError(input.path);
				}
				if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
					throw new PermissionDeniedError(input.path);
				}
			}
			throw error;
		}
	}

	private mapToFileInfo(snapshot: FileSnapshot): FileInfo {
		let type: 'file' | 'directory' | 'symlink';
		if (snapshot.isSymlink) {
			type = 'symlink';
		} else if (snapshot.isDirectory) {
			type = 'directory';
		} else {
			type = 'file';
		}

		return {
			name: snapshot.path.basename,
			path: snapshot.path.value,
			type,
			size: snapshot.size,
			modifiedTime: snapshot.modifiedAt.toISOString(),
			contentHash: snapshot.isDirectory ? undefined : snapshot.contentHash.value,
		};
	}
}
