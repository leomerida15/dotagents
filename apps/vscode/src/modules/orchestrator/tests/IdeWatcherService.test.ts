import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Configuration, Agent, SyncManifest } from "@dotagents/diff";
import { getVscodeMock, createFileSystemWatcherMock } from "./helpers/vscode-mock";

mock.module("vscode", getVscodeMock);

describe("IdeWatcherService", () => {
	let IdeWatcherService: typeof import("../infra/IdeWatcherService").IdeWatcherService;
	let service: InstanceType<typeof IdeWatcherService>;
	let config: Configuration;

	beforeEach(async () => {
		const module = await import("../infra/IdeWatcherService");
		IdeWatcherService = module.IdeWatcherService;
		service = new IdeWatcherService();

		const manifest = SyncManifest.create({
			lastProcessedAt: 0,
			lastActiveAgent: "none",
			currentAgent: "cursor",
			agents: {},
		});
		config = Configuration.create({
			workspaceRoot: "/mock/workspace",
			agents: [
				Agent.create({
					id: "cursor",
					name: "Cursor",
					sourceRoot: ".cursor",
					inbound: [],
					outbound: [],
				}),
			],
			manifest,
		});

		createFileSystemWatcherMock.mockClear();
	});

	it("should create watcher with correct pattern when register is called", () => {
		service.register("/mock/workspace", "cursor", config);

		expect(createFileSystemWatcherMock).toHaveBeenCalledTimes(1);
		const [pattern] = createFileSystemWatcherMock.mock.calls[0]!;
		expect(pattern.base).toEqual({ uri: { fsPath: "/mock/workspace" } });
		expect(pattern.pattern).toBe(".cursor/**");
	});

	it("should dispose previous watchers when register is called again", () => {
		service.register("/mock/workspace", "cursor", config);
		const firstWatcher = createFileSystemWatcherMock.mock.results[0]!.value;
		service.register("/mock/workspace", "cursor", config);

		expect(firstWatcher.dispose).toHaveBeenCalled();
	});

	it("should not create watcher when agent is not found in config", () => {
		service.register("/mock/workspace", "nonexistent", config);

		expect(createFileSystemWatcherMock).not.toHaveBeenCalled();
	});

	it("should not create watcher when sourceRoot is absolute path", () => {
		const manifest = SyncManifest.create({
			lastProcessedAt: 0,
			lastActiveAgent: "none",
			currentAgent: "cline",
			agents: {},
		});
		const configWithAbs = Configuration.create({
			workspaceRoot: "/mock/workspace",
			agents: [
				Agent.create({
					id: "cline",
					name: "Cline",
					sourceRoot: "/home/user/.cline",
					inbound: [],
					outbound: [],
				}),
			],
			manifest,
		});

		service.register("/mock/workspace", "cline", configWithAbs);

		expect(createFileSystemWatcherMock).not.toHaveBeenCalled();
	});

	it("should dispose all watchers when dispose is called", () => {
		service.register("/mock/workspace", "cursor", config);
		const watcher = createFileSystemWatcherMock.mock.results[0]!.value;
		service.dispose();

		expect(watcher.dispose).toHaveBeenCalled();
	});
});
