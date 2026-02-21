import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SyncStatus } from "../domain/SyncState";
import { getVscodeMock } from "./helpers/vscode-mock";

mock.module("vscode", getVscodeMock);

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
    let mockLogger: any;

    beforeEach(async () => {
        // Dynamic import to ensure mock.module applies
        const module = await import("../app/StartSyncOrchestration");
        StartSyncOrchestration = module.StartSyncOrchestration;

        mockStatusBar = { update: mock(() => { }) };
        mockSyncEngine = { syncAll: mock(() => Promise.resolve()), syncAgent: mock(() => Promise.resolve()) };
        mockInitializeProject = { execute: mock(() => Promise.resolve()) };
        mockMigrateExistingAgentsToBridge = { execute: mock(() => Promise.resolve({ migrated: [] })) };
        mockConfigRepo = {
            exists: mock(() => Promise.resolve(false)),
            load: mock(() => Promise.resolve({ agents: [], manifest: { currentAgent: "cursor" } })),
            ensureAIStructure: mock(() => Promise.resolve())
        };
        mockFetchAndInstallRules = { execute: mock(() => Promise.resolve()) };
        mockGetMissingRulesAgentIds = { execute: mock(() => Promise.resolve([])) };
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
            logger: mockLogger,
        });
    });

    it("should run migration then initialization when config does not exist", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockMigrateExistingAgentsToBridge.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root" });
        expect(mockInitializeProject.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root", force: false });
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
    });

    it("should NOT run migration or initialization when config exists", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockMigrateExistingAgentsToBridge.execute).not.toHaveBeenCalled();
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockConfigRepo.ensureAIStructure).toHaveBeenCalledWith("/mock/root");
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockGetMissingRulesAgentIds.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
    });

    it("should continue sync when getMissingRulesAgentIds or notifyMissingRules fails", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);
        mockGetMissingRulesAgentIds.execute.mockRejectedValueOnce(new Error("detection failed"));

        await orchestration.execute();

        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockGetMissingRulesAgentIds.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockSyncEngine.syncAgent).toHaveBeenCalledWith("/mock/root", "cursor");
        expect(mockLogger.warn).toHaveBeenCalled();
    });
});
