import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MigrateExistingAgentsToBridgeUseCase } from "../app/MigrateExistingAgentsToBridgeUseCase";

const workspaceRoot = "/mock/workspace";

describe("MigrateExistingAgentsToBridgeUseCase", () => {
    let mockConfigRepo: any;
    let mockSyncProject: any;
    let mockFileSystem: any;
    let mockLogger: any;
    let useCase: MigrateExistingAgentsToBridgeUseCase;

    beforeEach(() => {
        mockConfigRepo = {
            exists: mock(() => Promise.resolve(false)),
        };
        mockSyncProject = {
            execute: mock(() => Promise.resolve({ success: true, actions: [] })),
        };
        mockFileSystem = {
            mkdir: mock(() => Promise.resolve()),
        };
        mockLogger = {
            info: mock(() => {}),
            warn: mock(() => {}),
            error: mock(() => {}),
            debug: mock(() => {}),
        };
        useCase = new MigrateExistingAgentsToBridgeUseCase({
            configRepository: mockConfigRepo,
            syncProject: mockSyncProject,
            fileSystem: mockFileSystem,
            logger: mockLogger,
        });
    });

    it("returns empty migrated when .agents already exists", async () => {
        mockConfigRepo.exists.mockResolvedValue(true);

        const result = await useCase.execute({ workspaceRoot });

        expect(result.migrated).toEqual([]);
        expect(mockSyncProject.execute).not.toHaveBeenCalled();
        expect(mockFileSystem.mkdir).not.toHaveBeenCalled();
    });

    it("returns empty migrated when no IDE folders exist in workspace", async () => {
        mockConfigRepo.exists.mockResolvedValue(false);
        // Use a path that has no .cursor/.cline etc. (e.g. nonexistent or empty dir)
        const result = await useCase.execute({ workspaceRoot });

        expect(result.migrated).toEqual([]);
        expect(mockFileSystem.mkdir).not.toHaveBeenCalled();
        expect(mockSyncProject.execute).not.toHaveBeenCalled();
    });

    it("creates .agents/.ai and runs sync for each present IDE folder", async () => {
        const existsSyncMock = mock((path: string) => path.endsWith(".cursor"));
        mock.module("node:fs", () => ({ existsSync: existsSyncMock }));

        const { MigrateExistingAgentsToBridgeUseCase: UseCase } = await import("../app/MigrateExistingAgentsToBridgeUseCase");
        const u = new UseCase({
            configRepository: mockConfigRepo,
            syncProject: mockSyncProject,
            fileSystem: mockFileSystem,
            logger: mockLogger,
        });
        mockConfigRepo.exists.mockResolvedValue(false);

        const result = await u.execute({ workspaceRoot: "/tmp/foo" });

        expect(result.migrated).toEqual([{ agentId: "cursor", dir: ".cursor" }]);
        expect(mockFileSystem.mkdir).toHaveBeenCalledWith("/tmp/foo/.agents/.ai");
        expect(mockSyncProject.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                sourcePath: "/tmp/foo/.cursor",
                targetPath: "/tmp/foo/.agents",
                rules: expect.any(Array),
            }),
        );
    });
});
