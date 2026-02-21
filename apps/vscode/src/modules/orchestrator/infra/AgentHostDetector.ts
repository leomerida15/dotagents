import * as vscode from 'vscode';

export const detectAgentFromHostApp = (): string => {
	const appName = typeof vscode.env?.appName === 'string' ? vscode.env.appName : '';
	const lower = appName.toLowerCase();
	if (lower.includes('cline')) return 'cline';
	if (lower.includes('cursor')) return 'cursor';
	if (lower.includes('windsurf')) return 'windsurf';
	if (lower.includes('opencode')) return 'opencode';
	if (lower.includes('visual studio code') || lower.includes('vscode')) return 'cursor';
	return 'cursor';
};
