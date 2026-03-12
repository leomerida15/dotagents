import type { ILogger } from '../domain/logger.port';
import { LogLevel } from '../domain/log-level.vo';
import { LEVEL_SEVERITY, shouldLog } from '../utils/level-severity';
import { safeSerialize } from '../utils/safe-serialize';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Constructor props for DaemonFileLogger */
interface DaemonFileLoggerProps {
	filePath: string;
	level?: LogLevel;
}

/**
 * DaemonFileLogger — File-based logger for daemon processes.
 * Writes log entries to a file with ISO 8601 timestamps and level prefixes.
 * Uses synchronous file operations for simplicity and reliability.
 */
export class DaemonFileLogger implements ILogger {
	private readonly filePath: string;
	private threshold: LogLevel;

	constructor({ filePath, level = LogLevel.DEBUG }: DaemonFileLoggerProps) {
		this.filePath = filePath;
		this.threshold = level;
	}

	/** @inheritdoc */
	async debug(message: string, context?: unknown): Promise<void> {
		await this.write(LogLevel.DEBUG, message, context);
	}

	/** @inheritdoc */
	async info(message: string, context?: unknown): Promise<void> {
		await this.write(LogLevel.INFO, message, context);
	}

	/** @inheritdoc */
	async warn(message: string, context?: unknown): Promise<void> {
		await this.write(LogLevel.WARN, message, context);
	}

	/** @inheritdoc */
	async error(message: string, context?: unknown): Promise<void> {
		await this.write(LogLevel.ERROR, message, context);
	}

	/** @inheritdoc */
	setLevel(level: LogLevel): void {
		this.threshold = level;
	}

	/**
	 * Writes a log entry to the file.
	 * Ensures directory exists before writing.
	 * @param level - The log level for this message
	 * @param message - The message to log
	 * @param context - Optional context to serialize and append
	 */
	private async write(level: LogLevel, message: string, context?: unknown): Promise<void> {
		if (!shouldLog(level, this.threshold)) {
			return;
		}

		this.ensureDirectoryExists();

		const timestamp = new Date().toISOString();
		const contextStr = context !== undefined ? ` ${safeSerialize(context)}` : '';
		const line = `${timestamp} [${level}] ${message}${contextStr}\n`;

		try {
			appendFileSync(this.filePath, line, 'utf-8');
		} catch (error) {
			throw new Error(
				`Failed to write to log file "${this.filePath}": ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Ensures the directory for the log file exists.
	 * Creates it recursively if necessary.
	 */
	private ensureDirectoryExists(): void {
		const dir = dirname(this.filePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}
}
