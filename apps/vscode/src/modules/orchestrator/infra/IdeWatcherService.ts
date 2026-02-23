import * as vscode from 'vscode';
import type { Configuration } from '@dotagents/diff';
import { WORKSPACE_KNOWN_AGENTS, getSyncSourcePaths } from '../domain/WorkspaceAgents';

export interface IdeWatcherServiceProps {
	onChange?: (uri: vscode.Uri) => void;
	onCreate?: (uri: vscode.Uri) => void;
	onDelete?: (uri: vscode.Uri) => void;
}

/**
 * Manages FileSystemWatcher instances for the active IDE agent's source root(s).
 * Watches workspace paths (marker or sync_source) or a single sourceRoot for reactive sync.
 */
export class IdeWatcherService implements vscode.Disposable {
	private disposables: vscode.Disposable[] = [];
	private readonly onChange?: (uri: vscode.Uri) => void;
	private readonly onCreate?: (uri: vscode.Uri) => void;
	private readonly onDelete?: (uri: vscode.Uri) => void;

	constructor({ onChange, onCreate, onDelete }: IdeWatcherServiceProps = {}) {
		this.onChange = onChange;
		this.onCreate = onCreate;
		this.onDelete = onDelete;
	}

	/**
	 * Registers watchers for the active agent's source path(s).
	 * Disposes any existing watchers first.
	 */
	register(workspaceRoot: string, activeAgentId: string, config: Configuration): void {
		this.dispose();

		const agent = config.agents.find((a) => a.id === activeAgentId);
		if (!agent) return;

		const known = WORKSPACE_KNOWN_AGENTS.find((a) => a.id === activeAgentId);
		const pathsToWatch =
			known != null && known.paths != null && known.paths.length > 0
				? getSyncSourcePaths(known)
				: [{ path: agent.sourceRoot.replace(/\/$/, ''), type: 'directory' as const }];

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(workspaceRoot));
		const base = workspaceFolder ?? workspaceRoot;
		const noop = (_: vscode.Uri) => {};

		for (const p of pathsToWatch) {
			const rawPath = p.path.replace(/\/$/, '');
			if (rawPath.startsWith('/') || rawPath.startsWith('~')) continue;

			const pattern = p.type === 'file' ? rawPath : `${rawPath}/**`;
			const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(base, pattern));
			this.disposables.push(watcher.onDidCreate(this.onCreate ?? noop));
			this.disposables.push(watcher.onDidChange(this.onChange ?? noop));
			this.disposables.push(watcher.onDidDelete(this.onDelete ?? noop));
			this.disposables.push(watcher);
		}
	}

	dispose(): void {
		for (const d of this.disposables) {
			d.dispose();
		}
		this.disposables = [];
	}
}
