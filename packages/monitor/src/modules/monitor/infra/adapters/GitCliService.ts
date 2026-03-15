/**
 * GitCliService - Git command execution adapter.
 * Implements IGitService using child process execution.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { IGitService } from '../../domain/ports/IGitService';
import { GitInfo } from '../../domain/value-objects/GitInfo';

const execAsync = promisify(exec);

/**
 * Git CLI service implementation.
 */
export class GitCliService implements IGitService {
	constructor(private readonly projectRoot: string) {}

	async getCurrentCommit(): Promise<string | null> {
		try {
			const { stdout } = await execAsync('git rev-parse HEAD', {
				cwd: this.projectRoot,
				timeout: 5000,
			});
			return stdout.trim();
		} catch {
			return null;
		}
	}

	async getCurrentBranch(): Promise<string | null> {
		try {
			const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
				cwd: this.projectRoot,
				timeout: 5000,
			});
			const branch = stdout.trim();
			// Return null for detached HEAD
			return branch === 'HEAD' ? null : branch;
		} catch {
			return null;
		}
	}

	async isClean(): Promise<boolean | null> {
		try {
			const { stdout } = await execAsync('git status --porcelain', {
				cwd: this.projectRoot,
				timeout: 5000,
			});
			return stdout.trim().length === 0;
		} catch {
			return null;
		}
	}

	async getGitInfo(): Promise<GitInfo> {
		const [commitHash, branch, isClean] = await Promise.all([
			this.getCurrentCommit(),
			this.getCurrentBranch(),
			this.isClean(),
		]);

		if (commitHash === null) {
			return GitInfo.none();
		}

		return GitInfo.create({
			commitHash,
			branch,
			isClean,
		});
	}

	async isTracked(path: string): Promise<boolean | null> {
		try {
			const { stdout } = await execAsync(`git ls-files "${path}"`, {
				cwd: this.projectRoot,
				timeout: 5000,
			});
			return stdout.trim().length > 0;
		} catch {
			return null;
		}
	}

	async getDiff(path: string): Promise<string | null> {
		try {
			const { stdout } = await execAsync(`git diff "${path}"`, {
				cwd: this.projectRoot,
				timeout: 5000,
			});
			return stdout.trim() || null;
		} catch {
			return null;
		}
	}
}
