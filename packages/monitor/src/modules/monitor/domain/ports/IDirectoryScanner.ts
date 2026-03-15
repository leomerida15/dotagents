/**
 * Port for directory scanning operations.
 * Defines the interface for listing directory contents with metadata.
 */

import type { FileSnapshot } from '../entities/FileSnapshot';

/**
 * Options for scanning directories.
 */
export interface ScanOptions {
	/** Absolute path to scan */
	path: string;
	/** Whether to scan recursively */
	recursive?: boolean;
	/** Glob patterns to include (default: all) */
	include?: string[];
	/** Glob patterns to exclude */
	exclude?: string[];
	/** Whether to respect .gitignore patterns (default: true) */
	respectGitignore?: boolean;
	/** Whether to follow symbolic links (default: false) */
	followSymlinks?: boolean;
	/** Maximum directory depth for recursive scanning */
	maxDepth?: number;
}

/**
 * Port interface for directory scanning operations.
 */
export interface IDirectoryScanner {
	/**
	 * Scan a directory and return file snapshots.
	 * @param options - Scan configuration options
	 * @returns Array of file snapshots
	 * @throws {FileNotFoundError} If path does not exist
	 * @throws {PermissionDeniedError} If path is not readable
	 */
	scan(options: ScanOptions): Promise<FileSnapshot[]>;
}
