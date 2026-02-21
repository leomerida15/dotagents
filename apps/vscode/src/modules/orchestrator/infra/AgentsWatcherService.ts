import * as vscode from 'vscode';

export interface AgentsWatcherServiceProps {
	onChange?: (uri: vscode.Uri) => void;
	onCreate?: (uri: vscode.Uri) => void;
	onDelete?: (uri: vscode.Uri) => void;
}

/**
 * Manages FileSystemWatcher for the .agents bridge folder.
 * Watches .agents/** excluding .agents/.ai/ to avoid loops when the extension
 * modifies state.json (Sprint 3 will connect sync outbound).
 */
export class AgentsWatcherService implements vscode.Disposable {
	private disposables: vscode.Disposable[] = [];
	private readonly onChange?: (uri: vscode.Uri) => void;
	private readonly onCreate?: (uri: vscode.Uri) => void;
	private readonly onDelete?: (uri: vscode.Uri) => void;

	constructor({ onChange, onCreate, onDelete }: AgentsWatcherServiceProps = {}) {
		this.onChange = onChange;
		this.onCreate = onCreate;
		this.onDelete = onDelete;
	}

	/**
	 * Registers watchers for .agents (excluding .agents/.ai/).
	 * Disposes any existing watchers first.
	 */
	register(workspaceRoot: string): void {
		this.dispose();

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(workspaceRoot));
		const base = workspaceFolder ?? workspaceRoot;
		// Exclude .agents/.ai/ - only watch subdirs that do not start with .
		const pattern = new vscode.RelativePattern(base, '.agents/[!.]*/**');
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
