import { LogLevel } from '../domain/log-level.vo';

/**
 * Numeric severity mapping for log level comparison.
 * Used to determine if a message should be logged based on the configured threshold.
 */
export const LEVEL_SEVERITY: Record<LogLevel, number> = {
	[LogLevel.DEBUG]: 0,
	[LogLevel.INFO]: 1,
	[LogLevel.WARN]: 2,
	[LogLevel.ERROR]: 3,
};

/**
 * Checks if a log level should be logged based on the threshold.
 * @param level - The level of the message to check
 * @param threshold - The minimum level to log
 * @returns true if the message should be logged
 */
export function shouldLog(level: LogLevel, threshold: LogLevel): boolean {
	return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[threshold];
}
