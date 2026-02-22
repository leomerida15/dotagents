
import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { join } from 'path';
import { DefaultSyncInterpreter } from '../../infra/adapters/DefaultSyncInterpreter';
import { MappingFormat, MappingRule } from '../../../config/domain/value-objects/MappingRule';
import { ActionType } from '../../domain/value-objects/ActionType';
import { SyncManifest } from '../../../config/domain/entities/SyncManifest';

// Mock dependencies
const mockStat = mock(() => Promise.resolve({ isDirectory: () => false, mtimeMs: 0 }));
const mockAccess = mock((_path: string) => Promise.resolve(undefined));
const mockReaddir = mock(() => Promise.resolve([]));

mock.module('node:fs/promises', () => ({
    stat: mockStat,
    access: mockAccess,
    readdir: mockReaddir,
}));

describe('DefaultSyncInterpreter', () => {
    let interpreter: DefaultSyncInterpreter;
    const sourceRoot = '/source';
    const targetRoot = '/target';

    beforeEach(() => {
        interpreter = new DefaultSyncInterpreter();
        mockStat.mockReset();
        mockAccess.mockReset();
        mockReaddir.mockReset();
        // default implementation to avoid errors not handled in tests
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 0 });
        mockAccess.mockResolvedValue(undefined);
        mockReaddir.mockResolvedValue([]);
    });

    it('should copy if target does not exist', async () => {
        // Setup: Source exists, Target missing
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 100 });
        mockAccess.mockImplementation(async (path: string) => {
            if (path.startsWith(sourceRoot)) return undefined; // Source exists
            throw new Error('Not found'); // Target missing
        });

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.type).toBe(ActionType.COPY);
        expect(actions[0]!.target).toBe('/target/file.txt');
    });

    it('should NOT copy if target exists and no manifest provided (defaulting to copy for safety in current impl)', async () => {
        // Setup: Source exists, Target exists
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 100 });
        mockAccess.mockResolvedValue(undefined); // Both exist

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot });

        // Current implementation: defaults to COPY if no manifest
        expect(actions).toHaveLength(1);
        expect(actions[0]!.type).toBe(ActionType.COPY);
    });

    it('should copy if source is newer than manifest last sync', async () => {
        // Setup: Source newer
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 200 }); // Source modified at 200
        mockAccess.mockResolvedValue(undefined);

        const manifest = { lastProcessedAt: 100 } as unknown as SyncManifest; // Mock manifest

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot, manifest });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.type).toBe(ActionType.COPY);
    });

    it('should NOT copy if source is older than manifest last sync', async () => {
        // Setup: Source older
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 50 }); // Source modified at 50
        mockAccess.mockResolvedValue(undefined);

        const manifest = { lastProcessedAt: 100 } as unknown as SyncManifest;

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot, manifest });

        expect(actions).toHaveLength(0);
    });

    it('should DELETE target if source missing and enableDelete is true', async () => {
        // Setup: Source missing, Target exists
        mockStat.mockRejectedValue(new Error('Not found'));
        mockAccess.mockImplementation(async (path: string) => {
            if (path.startsWith(targetRoot)) return undefined; // Target exists
            throw new Error('Not found');
        });

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot, enableDelete: true });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.type).toBe(ActionType.DELETE);
        expect(actions[0]!.target).toBe('/target/file.txt');
    });

    it('should do nothing if source missing and enableDelete is false', async () => {
        // Setup: Source missing
        mockStat.mockRejectedValue(new Error('Not found'));

        const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot, enableDelete: false });

        expect(actions).toHaveLength(0);
    });

    it('should generate COPY only for affected paths when affectedPaths is provided', async () => {
        mockAccess.mockResolvedValue(undefined); // Both source and target exist

        const rule = MappingRule.create({ from: 'rules/', to: 'rules/', format: MappingFormat.DIRECTORY });
        const affectedPaths = [join(sourceRoot, 'rules', 'foo.yaml')];
        const actions = await interpreter.interpret(rule, {
            sourceRoot,
            targetRoot,
            affectedPaths,
        });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.type).toBe(ActionType.COPY);
        expect(actions[0]!.source).toBe(join(sourceRoot, 'rules', 'foo.yaml'));
        expect(actions[0]!.target).toBe(join(targetRoot, 'rules', 'foo.yaml'));
    });

    it('should not change target when rule has no sourceExt/targetExt (regression)', async () => {
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 100 });
        mockAccess.mockImplementation(async (path: string) => {
            if (path.startsWith(sourceRoot)) return undefined;
            throw new Error('Not found');
        });

        const rule = MappingRule.create({ from: 'rules/file.txt', to: 'rules/file.txt', format: MappingFormat.FILE });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.target).toBe(join(targetRoot, 'rules', 'file.txt'));
    });

    it('should convert extension for single file when sourceExt/targetExt present', async () => {
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 100 });
        mockAccess.mockImplementation(async (path: string) => {
            if (path.startsWith(sourceRoot)) return undefined;
            throw new Error('Not found');
        });

        const rule = MappingRule.create({
            from: 'rules/foo.mdc',
            to: 'rules/foo.mdc',
            format: MappingFormat.FILE,
            sourceExt: '.mdc',
            targetExt: '.md',
        });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.source).toBe(join(sourceRoot, 'rules', 'foo.mdc'));
        expect(actions[0]!.target).toBe(join(targetRoot, 'rules', 'foo.md'));
    });

    it('should convert extension in incremental mode when sourceExt/targetExt present', async () => {
        mockAccess.mockResolvedValue(undefined);

        const rule = MappingRule.create({
            from: 'rules/',
            to: 'rules/',
            format: MappingFormat.DIRECTORY,
            sourceExt: '.mdc',
            targetExt: '.md',
        });
        const affectedPaths = [join(sourceRoot, 'rules', 'foo.mdc')];
        const actions = await interpreter.interpret(rule, {
            sourceRoot,
            targetRoot,
            affectedPaths,
        });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.source).toBe(join(sourceRoot, 'rules', 'foo.mdc'));
        expect(actions[0]!.target).toBe(join(targetRoot, 'rules', 'foo.md'));
    });

    it('should not convert when file extension does not match sourceExt', async () => {
        mockStat.mockResolvedValue({ isDirectory: () => false, mtimeMs: 100 });
        mockAccess.mockImplementation(async (path: string) => {
            if (path.startsWith(sourceRoot)) return undefined;
            throw new Error('Not found');
        });

        const rule = MappingRule.create({
            from: 'rules/bar.txt',
            to: 'rules/bar.txt',
            format: MappingFormat.FILE,
            sourceExt: '.mdc',
            targetExt: '.md',
        });
        const actions = await interpreter.interpret(rule, { sourceRoot, targetRoot });

        expect(actions).toHaveLength(1);
        expect(actions[0]!.target).toBe(join(targetRoot, 'rules', 'bar.txt'));
    });
});
