import * as vscode from 'vscode';
import { WORKSPACE_KNOWN_AGENTS } from '../domain/WorkspaceAgents';

export const detectAgentFromHostApp = (): string => {
	const appName = typeof vscode.env?.appName === 'string' ? vscode.env.appName : '';
	const lower = appName.toLowerCase();
	for (const agent of WORKSPACE_KNOWN_AGENTS) {
		if (lower.includes(agent.id)) return agent.id;
	}
	return 'vscode';
};

export const isHostIdeRecognized = (): boolean => {
	const appName = typeof vscode.env?.appName === 'string' ? vscode.env.appName : '';
	const lower = appName.toLowerCase();
	for (const agent of WORKSPACE_KNOWN_AGENTS) {
		if (lower.includes(agent.id)) return true;
	}
	if (lower.includes('vscode') || lower.includes('visual studio code')) return true;
	return false;
};

export const getHostAppName = (): string =>
	(typeof vscode.env?.appName === 'string' ? vscode.env.appName : '') || 'Unknown';
