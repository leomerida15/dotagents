import { CliLogger } from './infrastructure/cli-logger';
import { DaemonFileLogger } from './infrastructure/daemon-file-logger';
import { PrettyErrorFormatter } from './infrastructure/pretty-error-formatter';
import { LogLevel } from './domain/log-level.vo';
import type { ILogger, IErrorFormatter } from './index';

/** Configuration options for the Logger module factory */
interface LoggerModuleConfig {
	/** Minimum log level for console and file loggers */
	level?: LogLevel;
	/** Path for file-based logging (enables DaemonFileLogger if provided) */
	logFilePath?: string;
}

/** Return type of createLoggerModule factory */
interface LoggerModule {
	/** Console logger for terminal output */
	consoleLogger: ILogger;
	/** File logger for daemon processes (null if logFilePath not provided) */
	fileLogger: ILogger | null;
	/** Error formatter for standardized error presentation */
	errorFormatter: IErrorFormatter;
}

/**
 * Factory function for the Logger module.
 * Creates configured instances ready for dependency injection.
 *
 * @param config - Optional configuration for log level and file path
 * @returns Object with consoleLogger, fileLogger, and errorFormatter instances
 *
 * @example
 * ```typescript
 * // Basic usage (console only)
 * const { consoleLogger, errorFormatter } = createLoggerModule();
 *
 * // With file logging for daemon
 * const { consoleLogger, fileLogger, errorFormatter } = createLoggerModule({
 *   level: LogLevel.DEBUG,
 *   logFilePath: '/var/log/myapp/daemon.log'
 * });
 * ```
 */
export function createLoggerModule({
	level = LogLevel.INFO,
	logFilePath,
}: LoggerModuleConfig = {}): LoggerModule {
	const consoleLogger = new CliLogger({ level });
	const errorFormatter = new PrettyErrorFormatter();
	const fileLogger = logFilePath ? new DaemonFileLogger({ filePath: logFilePath, level }) : null;

	return {
		consoleLogger,
		fileLogger,
		errorFormatter,
	};
}
