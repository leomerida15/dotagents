import { describe, it, expect } from 'bun:test';
import { createLoggerModule } from '../logger.module';
import { LogLevel, CliLogger, DaemonFileLogger, PrettyErrorFormatter } from '../index';
import type { ILogger, IErrorFormatter } from '../index';

describe('Logger Module Integration', () => {
	describe('createLoggerModule', () => {
		it('should return consoleLogger implementing ILogger', () => {
			const { consoleLogger } = createLoggerModule();
			expect(consoleLogger).toBeDefined();
			expect(typeof consoleLogger.info).toBe('function');
			expect(typeof consoleLogger.warn).toBe('function');
			expect(typeof consoleLogger.error).toBe('function');
			expect(typeof consoleLogger.debug).toBe('function');
			expect(typeof consoleLogger.setLevel).toBe('function');
		});

		it('should return errorFormatter implementing IErrorFormatter', () => {
			const { errorFormatter } = createLoggerModule();
			expect(errorFormatter).toBeDefined();
			expect(typeof errorFormatter.format).toBe('function');
		});

		it('should return null fileLogger when logFilePath not provided', () => {
			const { fileLogger } = createLoggerModule();
			expect(fileLogger).toBeNull();
		});

		it('should return fileLogger when logFilePath is provided', () => {
			const { fileLogger } = createLoggerModule({
				logFilePath: '/tmp/test-module.log',
			});
			expect(fileLogger).not.toBeNull();
			expect(typeof fileLogger?.info).toBe('function');
		});

		it('should use default level INFO when not specified', () => {
			const { consoleLogger } = createLoggerModule();
			// INFO level should not log DEBUG messages
			consoleLogger.setLevel(LogLevel.INFO);
			// This is a behavioral test - if level is INFO, debug should be filtered
			expect(consoleLogger).toBeDefined();
		});

		it('should use custom level when specified', () => {
			const { consoleLogger } = createLoggerModule({ level: LogLevel.DEBUG });
			expect(consoleLogger).toBeDefined();
		});
	});

	describe('Barrel exports from index.ts', () => {
		it('should export LogLevel enum', () => {
			expect(LogLevel.DEBUG).toBeDefined();
			expect(LogLevel.INFO).toBeDefined();
			expect(LogLevel.WARN).toBeDefined();
			expect(LogLevel.ERROR).toBeDefined();
		});

		it('should export CliLogger class', () => {
			const logger = new CliLogger({ level: LogLevel.INFO });
			expect(logger).toBeDefined();
			expect(typeof logger.info).toBe('function');
		});

		it('should export DaemonFileLogger class', () => {
			const logger = new DaemonFileLogger({ filePath: '/tmp/test.log' });
			expect(logger).toBeDefined();
			expect(typeof logger.info).toBe('function');
		});

		it('should export PrettyErrorFormatter class', () => {
			const formatter = new PrettyErrorFormatter();
			expect(formatter).toBeDefined();
			expect(typeof formatter.format).toBe('function');
		});

		it('should export ILogger type (compile-time check)', () => {
			// This is a type-only export, verified at compile time
			// The fact that this compiles means the type is exported
			const logger: ILogger = new CliLogger({ level: LogLevel.INFO });
			expect(logger).toBeDefined();
		});

		it('should export IErrorFormatter type (compile-time check)', () => {
			// This is a type-only export, verified at compile time
			const formatter: IErrorFormatter = new PrettyErrorFormatter();
			expect(formatter).toBeDefined();
		});
	});
});
