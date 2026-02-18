
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SyncStatus } from "../domain/SyncState";

// Mock VSCode BEFORE importing the module under test
const mockWorkspaceFolders = [{ uri: { fsPath: "/mock/root" } }];
mock.module("vscode", () => ({
    workspace: {
        workspaceFolders: mockWorkspaceFolders
    },
    window: {
        showErrorMessage: () => { }
    }
}));

describe("StartSyncOrchestration", () => {
    let StartSyncOrchestration: any;
    let orchestration: any;
    let mockStatusBar: any;
    let mockSyncEngine: any;
    let mockInitializeProject: any;
    let mockConfigRepo: any;
    let mockFetchAndInstallRules: any;

    beforeEach(async () => {
        // Dynamic import to ensure mock.module applies
        const module = await import("../app/StartSyncOrchestration");
        StartSyncOrchestration = module.StartSyncOrchestration;

        mockStatusBar = { update: mock(() => { }) };
        mockSyncEngine = { syncAll: mock(() => Promise.resolve()) };
        mockInitializeProject = { execute: mock(() => Promise.resolve()) };
        mockConfigRepo = {
            exists: mock(() => Promise.resolve(false)),
            load: mock(() => Promise.resolve({ agents: [] })),
            ensureAIStructure: mock(() => Promise.resolve())
        };
        mockFetchAndInstallRules = { execute: mock(() => Promise.resolve()) };

        orchestration = new StartSyncOrchestration({
            statusBar: mockStatusBar,
            syncEngine: mockSyncEngine,
            initializeProject: mockInitializeProject,
            configRepository: mockConfigRepo,
            fetchAndInstallRules: mockFetchAndInstallRules
        });
    });

    it("should run initialization when config does not exist", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockInitializeProject.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root", force: false });
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockSyncEngine.syncAll).toHaveBeenCalled();
    });

    it("should NOT run initialization when config exists", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockConfigRepo.ensureAIStructure).toHaveBeenCalledWith("/mock/root");
        expect(mockFetchAndInstallRules.execute).toHaveBeenCalledWith("/mock/root");
        expect(mockSyncEngine.syncAll).toHaveBeenCalled();
    });
});
