/**
 * FileSnapshot entity.
 * Represents the state of a file at a point in time.
 */

import type { FilePath } from '../value-objects/FilePath';
import type { ContentHash } from '../value-objects/ContentHash';

/**
 * Props for creating a FileSnapshot.
 */
export interface FileSnapshotProps {
	/** File path */
	path: FilePath;
	/** File size in bytes */
	size: number;
	/** Last modification time */
	modifiedAt: Date;
	/** Content hash */
	contentHash: ContentHash;
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a symbolic link */
	isSymlink: boolean;
	/** Target path if this is a symlink */
	targetPath?: string;
}

/**
 * Domain entity representing a file's state at a point in time.
 */
export class FileSnapshot {
	private constructor(private readonly props: FileSnapshotProps) {}

	/**
	 * Create a new FileSnapshot.
	 * @param props - Snapshot properties
	 * @returns A new FileSnapshot instance
	 */
	static create(props: FileSnapshotProps): FileSnapshot {
		return new FileSnapshot(props);
	}

	/** Get the file path. */
	get path(): FilePath {
		return this.props.path;
	}

	/** Get the file size in bytes. */
	get size(): number {
		return this.props.size;
	}

	/** Get the last modification time. */
	get modifiedAt(): Date {
		return this.props.modifiedAt;
	}

	/** Get the content hash. */
	get contentHash(): ContentHash {
		return this.props.contentHash;
	}

	/** Get whether this is a directory. */
	get isDirectory(): boolean {
		return this.props.isDirectory;
	}

	/** Get whether this is a symbolic link. */
	get isSymlink(): boolean {
		return this.props.isSymlink;
	}

	/** Get the symlink target path (if applicable). */
	get targetPath(): string | undefined {
		return this.props.targetPath;
	}

	/**
	 * Get a plain object representation.
	 */
	toJSON(): {
		path: string;
		size: number;
		modifiedAt: string;
		contentHash: string;
		isDirectory: boolean;
		isSymlink: boolean;
		targetPath?: string;
	} {
		return {
			path: this.props.path.value,
			size: this.props.size,
			modifiedAt: this.props.modifiedAt.toISOString(),
			contentHash: this.props.contentHash.value,
			isDirectory: this.props.isDirectory,
			isSymlink: this.props.isSymlink,
			targetPath: this.props.targetPath,
		};
	}
}
