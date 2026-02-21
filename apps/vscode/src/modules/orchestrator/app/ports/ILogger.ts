/**
 * Port for logging within the extension.
 * Allows output to Debug Console and optionally to a file (via adapter).
 */
export interface ILogger {
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
	debug(message: string, ...args: unknown[]): void;
}
