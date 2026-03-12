import type { LogLevel } from './log-level.vo';

/**
 * Output Port: Contract for the logger.
 * Implemented by adapters (e.g., ConsoleLogger, FileLogger).
 */
export interface ILogger {
	/**
	 * Logs a debug message.
	 * @param message - The content to log.
	 * @param context - Optional metadata.
	 */
	debug(message: string, context?: unknown): void;

	/**
	 * Logs an informational message.
	 * @param message - The content to log.
	 * @param context - Optional metadata.
	 */
	info(message: string, context?: unknown): void;

	/**
	 * Logs a warning message.
	 * @param message - The content to log.
	 * @param context - Optional metadata.
	 */
	warn(message: string, context?: unknown): void;

	/**
	 * Logs an error message.
	 * @param message - The content to log.
	 * @param context - Optional metadata.
	 */
	error(message: string, context?: unknown): void;

	/**
	 * Sets the current minimum log level.
	 * @param level - The level to set.
	 */
	setLevel(level: LogLevel): void;
}
