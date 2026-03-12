/**
 * Enum of log levels available in the system.
 * Used to categorize the severity or type of log entries.
 */
export enum LogLevel {
	/** Detailed information for debugging purposes */
	DEBUG = 'DEBUG',
	/** General operational information */
	INFO = 'INFO',
	/** Potential issues that do not break functionality */
	WARN = 'WARN',
	/** Errors that might require attention */
	ERROR = 'ERROR',
}
