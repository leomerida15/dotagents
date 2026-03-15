/**
 * FileEvent entity.
 * Represents a file system change event with full metadata.
 */

import type { FilePath } from '../value-objects/FilePath';
import { EventType } from '../value-objects/EventType';
import type { ContentHash } from '../value-objects/ContentHash';
import type { GitInfo } from '../value-objects/GitInfo';

/**
 * Props for creating a FileEvent.
 */
export interface FileEventProps {
	/** File path */
	path: FilePath;
	/** Event type */
	type: EventType;
	/** Previous content hash (null for created files) */
	oldHash: ContentHash | null;
	/** Current content hash (null for deleted files) */
	newHash: ContentHash | null;
	/** Git repository metadata */
	gitInfo: GitInfo;
	/** File size in bytes */
	size: number;
	/** Whether the file is tracked by Git */
	isGitTracked: boolean;
	/** Optional additional metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Domain entity representing a file system event.
 */
export class FileEvent {
	private constructor(
		private readonly _id: string,
		private readonly _timestamp: Date,
		private readonly props: FileEventProps,
	) {}

	/**
	 * Create a new FileEvent.
	 * @param props - Event properties (without id and timestamp)
	 * @returns A new FileEvent instance
	 */
	static create(props: FileEventProps): FileEvent {
		return new FileEvent(crypto.randomUUID(), new Date(), props);
	}

	/**
	 * Reconstitute a FileEvent from persisted data.
	 * @param id - Event ID
	 * @param timestamp - Event timestamp
	 * @param props - Event properties
	 * @returns A new FileEvent instance
	 */
	static reconstitute(id: string, timestamp: Date, props: FileEventProps): FileEvent {
		return new FileEvent(id, timestamp, props);
	}

	/** Get the event ID. */
	get id(): string {
		return this._id;
	}

	/** Get the event timestamp. */
	get timestamp(): Date {
		return this._timestamp;
	}

	/** Get the file path. */
	get path(): FilePath {
		return this.props.path;
	}

	/** Get the event type. */
	get type(): EventType {
		return this.props.type;
	}

	/** Get the previous content hash. */
	get oldHash(): ContentHash | null {
		return this.props.oldHash;
	}

	/** Get the current content hash. */
	get newHash(): ContentHash | null {
		return this.props.newHash;
	}

	/** Get the Git metadata. */
	get gitInfo(): GitInfo {
		return this.props.gitInfo;
	}

	/** Get the file size in bytes. */
	get size(): number {
		return this.props.size;
	}

	/** Get whether the file is Git tracked. */
	get isGitTracked(): boolean {
		return this.props.isGitTracked;
	}

	/** Get additional metadata. */
	get metadata(): Record<string, unknown> | undefined {
		return this.props.metadata;
	}

	/**
	 * Check if this event represents an actual content change.
	 * Returns false for events where hash hasn't changed.
	 */
	get isActualChange(): boolean {
		// For modified events, check if hash actually changed
		if (this.props.type === EventType.MODIFIED) {
			if (this.props.oldHash && this.props.newHash) {
				return !this.props.oldHash.equals(this.props.newHash);
			}
		}
		// Created and deleted are always actual changes
		return true;
	}
}
