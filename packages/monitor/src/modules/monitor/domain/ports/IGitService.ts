/**
 * Port for Git operations.
 * Defines the interface for retrieving Git repository metadata.
 */

import type { GitInfo } from '../value-objects/GitInfo';

/**
 * Port interface for Git service operations.
 */
export interface IGitService {
	/**
	 * Get the current Git commit hash (HEAD).
	 * @returns Commit hash or null if not a git repository
	 * @throws {GitError} If git command fails
	 */
	getCurrentCommit(): Promise<string | null>;

	/**
	 * Get the current Git branch name.
	 * @returns Branch name or null if in detached HEAD or not a git repository
	 * @throws {GitError} If git command fails
	 */
	getCurrentBranch(): Promise<string | null>;

	/**
	 * Check if the working directory is clean (no uncommitted changes).
	 * @returns True if clean, false if dirty, null if not a git repository
	 * @throws {GitError} If git command fails
	 */
	isClean(): Promise<boolean | null>;

	/**
	 * Get complete Git information.
	 * @returns GitInfo object with commit, branch, and status
	 */
	getGitInfo(): Promise<GitInfo>;

	/**
	 * Check if a file is tracked by Git.
	 * @param path - File path to check
	 * @returns True if tracked, false if not, null if not a git repository
	 */
	isTracked(path: string): Promise<boolean | null>;

	/**
	 * Get the diff for a file.
	 * @param path - File path
	 * @returns Diff string or null if not available
	 */
	getDiff(path: string): Promise<string | null>;
}
