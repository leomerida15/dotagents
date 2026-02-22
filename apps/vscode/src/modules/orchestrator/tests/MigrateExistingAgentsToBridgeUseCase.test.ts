import { describe, it, expect, mock, beforeEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";

import { join } from "node:path";
import { tmpdir } from "node:os";
import { MigrateExistingAgentsToBridgeUseCase } from "../app/MigrateExistingAgentsToBridgeUseCase";


const workspaceRoot = "/mock/workspace";

const MINIMAL_CURSOR_YAML = `version: "1.0"
agent:
  id: "cursor"
  name: "Cursor"
source_root: ".cursor/"
mapping:
  inbound:
    - from: "rules/"
      to: "rules/"
      format: "directory"
  outbound: []
target_standard: ".agents/"
`;

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
        const emptyDir = mkdtempSync(join(tmpdir(), "migrate-empty-"));
        try {
            const result = await useCase.execute({ workspaceRoot: emptyDir });

            expect(result.migrated).toEqual([]);
            expect(mockSyncProject.execute).not.toHaveBeenCalled();
        } finally {
            rmSync(emptyDir, { recursive: true, force: true });
        }
    });

    it("creates .agents/.ai and runs sync using YAML rules for each present IDE folder", async () => {
        const tmp = mkdtempSync(join(tmpdir(), "migrate-test-"));
        try {
            mkdirSync(join(tmp, ".cursor"), { recursive: true });
            mkdirSync(join(tmp, ".agents", ".ai", "rules"), { recursive: true });
            writeFileSync(join(tmp, ".agents", ".ai", "rules", "cursor.yaml"), MINIMAL_CURSOR_YAML);
            mockConfigRepo.exists.mockResolvedValue(false);

            const result = await useCase.execute({ workspaceRoot: tmp });

            expect(result.migrated).toEqual([{ agentId: "cursor", dir: ".cursor" }]);
            expect(mockFileSystem.mkdir).toHaveBeenCalledWith(join(tmp, ".agents", ".ai"));
            expect(mockSyncProject.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    sourcePath: join(tmp, ".cursor"),
                    targetPath: join(tmp, ".agents"),
                    rules: expect.arrayContaining([
                        expect.objectContaining({ from: "rules/", to: "rules/", format: "directory" }),
                    ]),
                }),
            );
        } finally {
            rmSync(tmp, { recursive: true, force: true });
        }
    });
});
