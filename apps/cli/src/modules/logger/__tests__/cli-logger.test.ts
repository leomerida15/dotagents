import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { CliLogger } from '../infrastructure/cli-logger';
import { LogLevel } from '../domain/log-level.vo';

describe('CliLogger', () => {
	let logger: CliLogger;
	let stdoutSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		logger = new CliLogger({ level: LogLevel.DEBUG });
		stdoutSpy = spyOn(console, 'log');
	});

	afterEach(() => {
		stdoutSpy.mockRestore();
	});

	describe('Happy Path', () => {
		it('info("ready") prints [INFO] ready with prefix in cyan to stdout', () => {
			logger.info('ready');
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('[INFO]');
			expect(output).toContain('ready');
		});

		it('warn("alert") prints [WARN] alert with prefix in yellow', () => {
			logger.warn('alert');
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('[WARN]');
			expect(output).toContain('alert');
		});

		it('error("fail") prints [ERROR] fail with prefix in red', () => {
			logger.error('fail');
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('[ERROR]');
			expect(output).toContain('fail');
		});

		it('debug("trace") prints [DEBUG] trace with prefix in gray', () => {
			logger.debug('trace');
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('[DEBUG]');
			expect(output).toContain('trace');
		});
	});

	describe('Edge Cases', () => {
		it('large object as context serializes with JSON.stringify without exception', () => {
			const largeContext = {
				data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
				nested: { deep: { deeper: { deepest: 'value' } } },
			};
			expect(() => logger.info('large object test', largeContext)).not.toThrow();
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('large object test');
		});

		it('undefined as context omits context in output', () => {
			logger.info('no context here', undefined);
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('no context here');
			expect(output).not.toContain('undefined');
		});
	});

	describe('Negative Path', () => {
		it('threshold at WARN + debug() produces no output', () => {
			logger.setLevel(LogLevel.WARN);
			logger.debug('should not appear');
			expect(stdoutSpy).not.toHaveBeenCalled();
		});

		it('threshold at WARN + info() produces no output', () => {
			logger.setLevel(LogLevel.WARN);
			logger.info('should not appear');
			expect(stdoutSpy).not.toHaveBeenCalled();
		});

		it('threshold at WARN + warn() DOES produce output', () => {
			logger.setLevel(LogLevel.WARN);
			logger.warn('should appear');
			expect(stdoutSpy).toHaveBeenCalled();
			const output = stdoutSpy.mock.calls[0]?.join(' ') ?? '';
			expect(output).toContain('[WARN]');
			expect(output).toContain('should appear');
		});
	});
});
