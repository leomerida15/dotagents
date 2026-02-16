
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

    beforeEach(async () => {
        // Dynamic import to ensure mock.module applies
        const module = await import("../app/StartSyncOrchestration");
        StartSyncOrchestration = module.StartSyncOrchestration;

        mockStatusBar = { update: mock(() => { }) };
        mockSyncEngine = { syncAll: mock(() => Promise.resolve()) };
        mockInitializeProject = { execute: mock(() => Promise.resolve()) };
        mockConfigRepo = { exists: mock(() => Promise.resolve(false)) };

        orchestration = new StartSyncOrchestration({
            statusBar: mockStatusBar,
            syncEngine: mockSyncEngine,
            initializeProject: mockInitializeProject,
            configRepository: mockConfigRepo
        });
    });

    it("should run initialization when config does not exist", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockInitializeProject.execute).toHaveBeenCalled();
        // Using objectContaining or exact match
        expect(mockInitializeProject.execute).toHaveBeenCalledWith({ workspaceRoot: "/mock/root", force: false });
        expect(mockSyncEngine.syncAll).toHaveBeenCalled();
    });

    it("should NOT run initialization when config exists", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);

        await orchestration.execute();

        expect(mockConfigRepo.exists).toHaveBeenCalledWith("/mock/root");
        expect(mockInitializeProject.execute).not.toHaveBeenCalled();
        expect(mockSyncEngine.syncAll).toHaveBeenCalled();
    });
});
