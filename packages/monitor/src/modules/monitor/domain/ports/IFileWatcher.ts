/**
 * Port for file watching operations.
 * Defines the interface for subscribing to file system changes.
 */

import type { Observable } from '../../infra/utils/Observable';
import type { FileEvent } from '../entities/FileEvent';

/**
 * Options for watching files or directories.
 */
export interface WatchOptions {
	/** Absolute path to watch */
	path: string;
	/** Whether to watch recursively */
	recursive?: boolean;
	/** Glob patterns to include (default: all) */
	include?: string[];
	/** Glob patterns to exclude */
	exclude?: string[];
	/** Whether to respect .gitignore patterns (default: true) */
	respectGitignore?: boolean;
	/** Maximum directory depth for recursive watching */
	maxDepth?: number;
	/** Debounce time in milliseconds (default: 200) */
	debounceMs?: number;
}

/**
 * Port interface for file watching operations.
 */
export interface IFileWatcher {
	/**
	 * Start watching a path with the given options.
	 * @param options - Watch configuration options
	 * @returns Observable that emits FileEvent on changes
	 */
	watch(options: WatchOptions): Observable<FileEvent>;

	/**
	 * Stop watching a specific path.
	 * @param path - Path to unwatch
	 */
	unwatch(path: string): void;

	/**
	 * Stop watching all paths.
	 */
	unwatchAll(): void;
}
