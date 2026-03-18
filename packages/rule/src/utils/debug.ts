/**
 * Debug utility for DotAgents
 *
 * Usage:
 *   DOTAGENTS_DEBUG=true bun run build   # Enable debug logs
 *   bun run build                        # Production - no debug logs
 *
 * In code:
 *   import { debug } from './debug';
 *
 *   if (debug.enabled) {
 *     // do debug stuff
 *   }
 */

import { appendFileSync } from 'node:fs';

const DEBUG_ENV_VAR = 'DOTAGENTS_DEBUG';

export const debug = {
	/**
	 * Check if debug mode is enabled
	 * Set DOTAGENTS_DEBUG=1 or DOTAGENTS_DEBUG=true to enable
	 */
	get enabled(): boolean {
		return (
			process.env[DEBUG_ENV_VAR] === '1' ||
			process.env[DEBUG_ENV_VAR]?.toLowerCase() === 'true'
		);
	},

	/**
	 * Get the current environment
	 */
	get env(): string {
		return process.env.NODE_ENV || 'development';
	},

	/**
	 * Check if running in production
	 */
	get isProduction(): boolean {
		return this.env === 'production' || this.env === 'prod';
	},

	/**
	 * Check if running in development
	 */
	get isDevelopment(): boolean {
		return this.env === 'development' || this.env === 'dev';
	},
};

/**
 * Write debug log to file (only when DOTAGENTS_DEBUG is enabled)
 */
export function debugLog(message: string): void {
	if (!debug.enabled) return;

	try {
		const timestamp = new Date().toISOString();
		const logMessage = `${timestamp} [DEBUG] ${message}\n`;
		appendFileSync('extension-debug.log', logMessage, 'utf8');
	} catch {
		// Silently ignore if we can't write
	}
}
