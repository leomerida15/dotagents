import * as vscode from 'vscode';
import type { Configuration } from '@dotagents/diff';

export interface IdeWatcherServiceProps {
	onChange?: (uri: vscode.Uri) => void;
	onCreate?: (uri: vscode.Uri) => void;
	onDelete?: (uri: vscode.Uri) => void;
}

/**
 * Manages FileSystemWatcher instances for the active IDE agent's source root.
 * Watches .cursor, .cline, .windsurf, etc. for reactive sync (Sprint 3).
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
	 * Registers watchers for the active agent's source root.
	 * Disposes any existing watchers first.
	 */
	register(workspaceRoot: string, activeAgentId: string, config: Configuration): void {
		this.dispose();

		const agent = config.agents.find((a) => a.id === activeAgentId);
		if (!agent) return;

		let sourceRoot = agent.sourceRoot;
		// Normalize: ensure no trailing slash for pattern
		sourceRoot = sourceRoot.replace(/\/$/, '');

		// Skip absolute paths outside workspace (e.g. ~/.cline) - we only watch workspace-scoped roots
		if (sourceRoot.startsWith('/') || sourceRoot.startsWith('~')) {
			return;
		}

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(workspaceRoot));
		const base = workspaceFolder ?? workspaceRoot;
		const pattern = new vscode.RelativePattern(base, `${sourceRoot}/**`);
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);

		const noop = (_: vscode.Uri) => {};
		this.disposables.push(watcher.onDidCreate(this.onCreate ?? noop));
		this.disposables.push(watcher.onDidChange(this.onChange ?? noop));
		this.disposables.push(watcher.onDidDelete(this.onDelete ?? noop));
		this.disposables.push(watcher);
	}

	dispose(): void {
		for (const d of this.disposables) {
			d.dispose();
		}
		this.disposables = [];
	}
}
