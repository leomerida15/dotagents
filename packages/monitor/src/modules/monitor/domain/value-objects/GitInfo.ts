/**
 * GitInfo value object.
 * Represents Git repository metadata captured at a point in time.
 */

/**
 * Error thrown when Git info is invalid.
 */
export class InvalidGitInfoError extends Error {
	constructor(message: string) {
		super(`Invalid Git info: ${message}`);
		this.name = 'InvalidGitInfoError';
	}
}

/**
 * Props for creating GitInfo.
 */
export interface GitInfoProps {
	/** Git commit hash (40-character SHA) */
	commitHash: string | null;
	/** Git branch name */
	branch: string | null;
	/** Whether the working directory is clean */
	isClean: boolean | null;
}

/**
 * Immutable value object representing Git repository metadata.
 */
export class GitInfo {
	private constructor(private readonly props: GitInfoProps) {}

	/**
	 * Create a new GitInfo instance.
	 * @param props - The Git metadata properties
	 * @returns A new GitInfo instance
	 */
	static create(props: GitInfoProps): GitInfo {
		// Validate commit hash format if provided
		if (props.commitHash !== null && props.commitHash.length !== 40) {
			throw new InvalidGitInfoError('Commit hash must be 40 characters if provided');
		}

		return new GitInfo({
			commitHash: props.commitHash,
			branch: props.branch,
			isClean: props.isClean,
		});
	}

	/**
	 * Create a GitInfo representing a non-git directory.
	 */
	static none(): GitInfo {
		return new GitInfo({
			commitHash: null,
			branch: null,
			isClean: null,
		});
	}

	/**
	 * Get the Git commit hash.
	 */
	get commitHash(): string | null {
		return this.props.commitHash;
	}

	/**
	 * Get the Git branch name.
	 */
	get branch(): string | null {
		return this.props.branch;
	}

	/**
	 * Get whether the working directory is clean.
	 */
	get isClean(): boolean | null {
		return this.props.isClean;
	}

	/**
	 * Check if this represents a valid Git repository.
	 */
	get isValid(): boolean {
		return this.props.commitHash !== null;
	}

	/**
	 * Check if this GitInfo equals another.
	 * @param other - Another GitInfo to compare
	 */
	equals(other: GitInfo): boolean {
		return (
			this.props.commitHash === other.props.commitHash &&
			this.props.branch === other.props.branch &&
			this.props.isClean === other.props.isClean
		);
	}
}
