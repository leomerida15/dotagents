import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as realFs from "node:fs";
import { SyncStatus } from "../domain/SyncState";
import { getVscodeMock } from "./helpers/vscode-mock";

mock.module("vscode", getVscodeMock);
const defaultExistsSync = (path: string) => {
    if (!path.startsWith("/mock/root")) return realFs.existsSync(path);
    return path.includes("/.cursor") || path.endsWith("cursor.yaml") || path.includes(".agents/.ai/rules/");
};
const existsSyncMock = mock(defaultExistsSync);
mock.module("node:fs", () => ({ ...realFs, existsSync: existsSyncMock }));

describe("StartSyncOrchestration", () => {
    let StartSyncOrchestration: any;
    let orchestration: any;
    let mockStatusBar: any;
    let mockSyncEngine: any;
    let mockInitializeProject: any;
    let mockMigrateExistingAgentsToBridge: any;
    let mockConfigRepo: any;
    let mockFetchAndInstallRules: any;
    let mockGetMissingRulesAgentIds: any;
    let mockSelectAgentForNewProject: any;
    let mockLogger: any;
    let callOrder: string[];

    const createConfigWithManifest = () => ({
        agents: [],
        manifest: {
            currentAgent: "cursor",
            setCurrentAgent: mock(() => {}),
            setLastActiveAgent: mock(() => {}),
        },
    });

    beforeEach(async () => {
        existsSyncMock.mockImplementation(defaultExistsSync);
        // Dynamic import to ensure mock.module applies
        const module = await import("../app/StartSyncOrchestration");
        StartSyncOrchestration = module.StartSyncOrchestration;

        mockStatusBar = { update: mock(() => { }) };
        callOrder = [];
        mockSyncEngine = { syncAll: mock(() => Promise.resolve()), syncAgent: mock(() => Promise.resolve()) };
        mockInitializeProject = { execute: mock(() => Promise.resolve()) };
        mockMigrateExistingAgentsToBridge = {
            execute: mock(async (input: { workspaceRoot: string }) => {
                callOrder.push("migrate");
                return Promise.resolve({ migrated: [] });
            }),
        };
        mockConfigRepo = {
            exists: mock(() => Promise.resolve(false)),
            load: mock(() => Promise.resolve(createConfigWithManifest())),
            save: mock(() => Promise.resolve()),
            ensureAIStructure: mock(() => Promise.resolve())
        };
        mockFetchAndInstallRules = {
            execute: mock(async () => {
                callOrder.push("fetch");
                return Promise.resolve();
            }),
        };
        mockGetMissingRulesAgentIds = { execute: mock(() => Promise.resolve([])) };
        mockSelectAgentForNewProject = mock(() => Promise.resolve("cursor"));
        mockLogger = {
            info: mock(() => { }),
            warn: mock(() => { }),
            error: mock(() => { }),
            debug: mock(() => { }),
        };

        orchestration = new StartSyncOrchestration({
            statusBar: mockStatusBar,
            syncEngine: mockSyncEngine,
            initializeProject: mockInitializeProject,
            migrateExistingAgentsToBridge: mockMigrateExistingAgentsToBridge,
            configRepository: mockConfigRepo,
            fetchAndInstallRules: mockFetchAndInstallRules,
            getMissingRulesAgentIds: mockGetMissingRulesAgentIds,
            selectAgentForNewProject: mockSelectAgentForNewProject,
            logger: mockLogger,
        });
    });

    it("should run fetch before migrate then init when config does not exist", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);

        const result = await orchestration.execute();

        expect(result).toEqual({ completed: true });
        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockSelectAgentForNewProject).toHaveBeenCalledWith("/mock/root");
        expect(callOrder.indexOf("fetch")).toBeLessThan(callOrder.indexOf("migrate"));
        expect(mockMigrateExistingAgentsToBridge.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root", selectedAgentId: "cursor" });
        expect(mockInitializeProject.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root", force: false });
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root", { agentIds: ["cursor"] });
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
    });

    it("should NOT run migration or init when config does not exist and user cancels selector", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);
        mockSelectAgentForNewProject.mockResolvedValueOnce(null);

        const result = await orchestration.execute();

        expect(result).toEqual({ completed: false });
        expect(mockSelectAgentForNewProject).toHaveBeenCalledWith("/mock/root");
        expect(mockMigrateExistingAgentsToBridge.execute).not.toHaveBeenCalled();
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockSyncEngine.syncAgent).not.toHaveBeenCalled();
        expect(mockStatusBar.update).toHaveBeenCalledWith(SyncStatus.ERROR, "Select a tool to continue");
    });

    it("should NOT run migration or initialization when config exists", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockMigrateExistingAgentsToBridge.execute).not.toHaveBeenCalled();
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockConfigRepo.ensureAIStructure).toHaveBeenCalledWith("/mock/root");
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root", { agentIds: ["cursor"] });
        expect(mockGetMissingRulesAgentIds.execute).toHaveBeenCalledWith("/mock/root", { agentIds: ["cursor"] });
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
    });

    it("should continue sync when getMissingRulesAgentIds or notifyMissingRules fails", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);
        mockGetMissingRulesAgentIds.execute.mockRejectedValueOnce(new Error("detection failed"));

        await orchestration.execute();

        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root", { agentIds: ["cursor"] });
        expect(mockGetMissingRulesAgentIds.execute).toHaveBeenCalledWith("/mock/root", { agentIds: ["cursor"] });
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
        expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should NOT sync when selectedAgentId is in missingIds", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);
        mockGetMissingRulesAgentIds.execute.mockResolvedValueOnce(["cursor"]);

        const result = await orchestration.execute();

        expect(result).toEqual({ completed: false });
        expect(mockSyncEngine.syncAgent).not.toHaveBeenCalled();
        expect(mockStatusBar.update).toHaveBeenCalledWith(SyncStatus.ERROR, "Reglas faltantes para cursor");
    });

    it("should return false when rules file does not exist for new project", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);
        existsSyncMock.mockImplementation((path: string) => !path.endsWith("cursor.yaml"));

        const result = await orchestration.execute();

        expect(result).toEqual({ completed: false });
        expect(mockMigrateExistingAgentsToBridge.execute).not.toHaveBeenCalled();
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockStatusBar.update).toHaveBeenCalledWith(SyncStatus.ERROR, "Reglas faltantes para cursor");
    });
});
