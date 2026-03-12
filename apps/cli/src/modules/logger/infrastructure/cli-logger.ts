import type { ILogger } from '../domain/logger.port';
import { LogLevel } from '../domain/log-level.vo';
import { LEVEL_SEVERITY, shouldLog } from '../utils/level-severity';
import { safeSerialize } from '../utils/safe-serialize';

/** ANSI escape codes for log level colors */
const ANSI_COLORS = {
	DEBUG: '\x1b[90m',
	INFO: '\x1b[36m',
	WARN: '\x1b[33m',
	ERROR: '\x1b[31m',
	RESET: '\x1b[0m',
} as const;

/** Constructor props for CliLogger */
interface CliLoggerProps {
	level?: LogLevel;
}

/**
 * CLI logger implementation with ANSI-colored output.
 * Logs messages to stdout with colored level prefixes and optional context serialization.
 */
export class CliLogger implements ILogger {
	private level: LogLevel;

	constructor({ level = LogLevel.DEBUG }: CliLoggerProps = {}) {
		this.level = level;
	}

	/** @inheritdoc */
	debug(message: string, context?: unknown): void {
		this.log(LogLevel.DEBUG, message, context);
	}

	/** @inheritdoc */
	info(message: string, context?: unknown): void {
		this.log(LogLevel.INFO, message, context);
	}

	/** @inheritdoc */
	warn(message: string, context?: unknown): void {
		this.log(LogLevel.WARN, message, context);
	}

	/** @inheritdoc */
	error(message: string, context?: unknown): void {
		this.log(LogLevel.ERROR, message, context);
	}

	/** @inheritdoc */
	setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Logs a message with the specified level if it passes the threshold.
	 * @param level - The log level for this message
	 * @param message - The message to log
	 * @param context - Optional context to serialize and append
	 */
	private log(level: LogLevel, message: string, context?: unknown): void {
		if (!shouldLog(level, this.level)) {
			return;
		}

		const color = ANSI_COLORS[level];
		const prefix = `${color}[${level}]${ANSI_COLORS.RESET}`;
		let output = `${prefix} ${message}`;

		if (context !== undefined) {
			output += ` ${safeSerialize(context)}`;
		}

		console.log(output);
	}
}
