import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DaemonFileLogger } from '../infrastructure/daemon-file-logger';
import { LogLevel } from '../domain/log-level.vo';
import { rmSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

const TEST_LOG_PATH = '/tmp/dotagents-test-daemon/daemon.log';
const TEST_LOG_DIR = '/tmp/dotagents-test-daemon';

describe('DaemonFileLogger', () => {
	let logger: DaemonFileLogger;

	beforeEach(() => {
		if (existsSync(TEST_LOG_DIR)) rmSync(TEST_LOG_DIR, { recursive: true });
		logger = new DaemonFileLogger({ filePath: TEST_LOG_PATH });
	});

	afterEach(() => {
		if (existsSync(TEST_LOG_DIR)) rmSync(TEST_LOG_DIR, { recursive: true });
	});

	describe('Happy Path', () => {
		it('should append log entry with [INFO] level to file', async () => {
			await logger.info('started');
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('[INFO]');
			expect(content).toContain('started');
		});

		it('should format timestamp in ISO 8601 format', async () => {
			await logger.info('timestamp test');
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it('should accumulate messages (append, not overwrite)', async () => {
			await logger.info('first message');
			await logger.info('second message');
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('first message');
			expect(content).toContain('second message');
			const firstIndex = content.indexOf('first message');
			const secondIndex = content.indexOf('second message');
			expect(secondIndex).toBeGreaterThan(firstIndex);
		});

		it('should serialize object context as JSON on same line', async () => {
			const context = { userId: 123, action: 'login' };
			await logger.info('user action', context);
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('user action');
			expect(content).toContain('"userId":123');
			expect(content).toContain('"action":"login"');
		});
	});

	describe('Edge Cases', () => {
		it('should create log directory automatically if it does not exist', async () => {
			expect(existsSync(TEST_LOG_DIR)).toBe(false);
			await logger.info('auto create dir');
			expect(existsSync(TEST_LOG_DIR)).toBe(true);
			expect(existsSync(TEST_LOG_PATH)).toBe(true);
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('auto create dir');
		});

		it('should recreate directory if deleted during runtime', async () => {
			await logger.info('first write');
			expect(existsSync(TEST_LOG_DIR)).toBe(true);
			rmSync(TEST_LOG_DIR, { recursive: true });
			expect(existsSync(TEST_LOG_DIR)).toBe(false);
			await logger.info('second write after deletion');
			expect(existsSync(TEST_LOG_DIR)).toBe(true);
			expect(existsSync(TEST_LOG_PATH)).toBe(true);
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('second write after deletion');
		});
	});

	describe('Negative Path', () => {
		it('should throw descriptive error when file is not accessible', async () => {
			const invalidLogger = new DaemonFileLogger({ filePath: '/root/protected/daemon.log' });
			await expect(invalidLogger.info('should fail')).rejects.toThrow();
		});

		it('should handle circular reference in context without throwing', async () => {
			const circularContext: { name: string; self?: unknown } = { name: 'circular' };
			circularContext.self = circularContext;
			// If this throws, the test fails automatically
			await logger.info('circular test', circularContext);
			const content = readFileSync(TEST_LOG_PATH, 'utf-8');
			expect(content).toContain('circular test');
		});
	});
});
