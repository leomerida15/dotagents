import { mock } from "bun:test";

export const mockWorkspaceFolders = [{ uri: { fsPath: "/mock/root" } }];

const watcherDisposeMock = mock(() => {});
export const createFileSystemWatcherMock = mock(() => ({
	onDidCreate: mock(() => ({ dispose: mock(() => {}) })),
	onDidChange: mock(() => ({ dispose: mock(() => {}) })),
	onDidDelete: mock(() => ({ dispose: mock(() => {}) })),
	dispose: watcherDisposeMock,
}));

export const getWorkspaceFolderMock = mock((uri: { fsPath: string }) => ({
	uri: { fsPath: uri.fsPath },
}));

export const getVscodeMock = () => ({
	workspace: {
		workspaceFolders: mockWorkspaceFolders,
		createFileSystemWatcher: createFileSystemWatcherMock,
		getWorkspaceFolder: getWorkspaceFolderMock,
	},
	window: { showErrorMessage: () => {} },
	env: { appName: "Cursor" },
	Uri: { file: (p: string) => ({ fsPath: p }) },
	RelativePattern: class {
		constructor(public base: unknown, public pattern: string) {}
	},
});
