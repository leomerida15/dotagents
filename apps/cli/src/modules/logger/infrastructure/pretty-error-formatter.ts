import type { IErrorFormatter } from '../domain/error-formatter.port';
import { safeSerialize } from '../utils/safe-serialize';

/**
 * PrettyErrorFormatter — Formats errors in a readable and standardized way.
 * Handles native Error objects, strings, nulls, and circular references.
 */
export class PrettyErrorFormatter implements IErrorFormatter {
	/**
	 * Formats any value as a readable error string.
	 * @param error - The value to format (Error, string, object, null, etc.)
	 * @returns A string representation of the formatted error.
	 */
	format(error: unknown): string {
		if (error === null) {
			return '[Error] (null)';
		}

		if (error === undefined) {
			return '[Error] (undefined)';
		}

		if (typeof error === 'string') {
			return `[Error] ${error}`;
		}

		if (error instanceof Error) {
			return this.formatError(error);
		}

		return `[Error] ${safeSerialize(error)}`;
	}

	/**
	 * Formats an Error object with its cause chain.
	 * @param error - The Error to format
	 * @param depth - Current indentation depth for nested causes
	 * @returns Formatted error string with cause chain
	 */
	private formatError(error: Error, depth = 0): string {
		const indent = '  '.repeat(depth);
		const message = `${indent}[Error] ${error.message}`;
		const lines = [message];

		if (error.cause instanceof Error) {
			lines.push(`${indent}  Caused by:`);
			lines.push(this.formatError(error.cause, depth + 2));
		} else if (error.cause !== undefined) {
			lines.push(`${indent}  Cause: ${safeSerialize(error.cause)}`);
		}

		return lines.join('\n');
	}
}
