import * as vscode from 'vscode';
import { join, dirname } from 'node:path';
import { appendFileSync, mkdirSync } from 'node:fs';
import type { ILogger } from '../app/ports/ILogger';

const PREFIX = '[DotAgents]';

export interface ExtensionLoggerProps {
	getWorkspaceRoot: () => string | undefined;
}

/**
 * Logger adapter that writes to Debug Console and optionally to a file
 * based on dotagents.debug.* configuration.
 */
export class ExtensionLogger implements ILogger {
	private readonly getWorkspaceRoot: () => string | undefined;

	constructor({ getWorkspaceRoot }: ExtensionLoggerProps) {
		this.getWorkspaceRoot = getWorkspaceRoot;
	}

	private formatLine(level: string, message: string, ...args: unknown[]): string {
		const timestamp = new Date().toISOString();
		const rest = args.length
			? ' ' +
				args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
			: '';
		return `${timestamp} [${level}] ${message}${rest}\n`;
	}

	private writeToFileIfEnabled(level: string, message: string, ...args: unknown[]): void {
		// Always write to extension-debug.log in project root for debugging
		// Can be disabled by setting dotagents.debug.logToFile to false
		const rootConfig = vscode.workspace.getConfiguration();
		const logToFile = rootConfig.get<boolean>('dotagents.debug.logToFile', true); // Default: true for debugging
		if (!logToFile) return;

		const workspaceRoot = this.getWorkspaceRoot();
		// Always write to extension-debug.log in project root
		const logFilePath = 'extension-debug.log';
		const baseDir = workspaceRoot || process.cwd();
		const fullPath = join(baseDir, logFilePath);

		try {
			mkdirSync(dirname(fullPath), { recursive: true });
			appendFileSync(fullPath, this.formatLine(level, message, ...args), 'utf8');
		} catch {
			// Do not throw; fallback to console only
			console.error(`${PREFIX} Failed to write to log file ${fullPath}`);
		}
	}

	info(message: string, ...args: unknown[]): void {
		console.log(PREFIX, message, ...args);
		this.writeToFileIfEnabled('INFO', message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		console.warn(PREFIX, message, ...args);
		this.writeToFileIfEnabled('WARN', message, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		console.error(PREFIX, message, ...args);
		this.writeToFileIfEnabled('ERROR', message, ...args);
	}

	debug(message: string, ...args: unknown[]): void {
		console.debug(PREFIX, message, ...args);
		this.writeToFileIfEnabled('DEBUG', message, ...args);
	}
}
