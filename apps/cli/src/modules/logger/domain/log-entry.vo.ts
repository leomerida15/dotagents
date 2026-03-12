import type { LogLevel } from './log-level.vo';

/**
 * Represents an immutable log entry with metadata.
 */
export interface LogEntry {
	/** The severity level of the log */
	readonly level: LogLevel;
	/** The actual message or content to be logged */
	readonly message: string;
	/** When the log entry was created */
	readonly timestamp: Date;
	/** Optional additional context or data related to the event */
	readonly context?: unknown;
}
