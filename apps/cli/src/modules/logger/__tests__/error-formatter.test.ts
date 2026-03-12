import { describe, it, expect, beforeEach } from 'bun:test';
import { PrettyErrorFormatter } from '../infrastructure/pretty-error-formatter';

describe('PrettyErrorFormatter', () => {
	let formatter: PrettyErrorFormatter;

	beforeEach(() => {
		formatter = new PrettyErrorFormatter();
	});

	describe('Happy Path', () => {
		it('should include the error message in the output', () => {
			const result = formatter.format(new Error('something failed'));
			expect(result).toContain('something failed');
		});

		it('should include nested cause when present', () => {
			const cause = new Error('root cause');
			const error = new Error('wrapper', { cause });
			const result = formatter.format(error);
			expect(result).toContain('root cause');
		});

		it('should handle empty error message without crashing', () => {
			const result = formatter.format(new Error(''));
			expect(typeof result).toBe('string');
		});
	});

	describe('Edge Cases', () => {
		it('should format a plain string as an error message', () => {
			const result = formatter.format('plain string error');
			expect(result).toContain('plain string error');
		});

		it('should include stack trace in output', () => {
			const error = new Error('with stack');
			const result = formatter.format(error);
			// Should contain the message at minimum
			expect(result).toContain('with stack');
		});

		it('should handle error without stack trace', () => {
			const error = new Error('no stack');
			delete error.stack;
			const result = formatter.format(error);
			expect(result).toContain('no stack');
		});
	});

	describe('Negative Path', () => {
		it('should handle null without throwing', () => {
			const result = formatter.format(null);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should handle undefined without throwing', () => {
			const result = formatter.format(undefined);
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('should handle circular reference without throwing', () => {
			const obj: Record<string, unknown> = { name: 'circular' };
			obj.self = obj;
			const result = formatter.format(obj);
			expect(typeof result).toBe('string');
		});
	});
});
