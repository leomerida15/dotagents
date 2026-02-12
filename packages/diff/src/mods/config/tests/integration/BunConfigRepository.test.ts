import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { BunConfigRepository } from '../../infra/adapters/BunConfigRepository';
import { Configuration } from '../../domain/entities/Configuration';
import { SyncManifest } from '../../domain/entities/SyncManifest';
import { Agent } from '../../domain/entities/Agent';
import { MappingRule, MappingFormat } from '../../domain/value-objects/MappingRule';

describe('BunConfigRepository Integration Test', () => {
    const TEST_WORKSPACE = join(process.cwd(), 'temp_test_workspace');

    beforeEach(async () => {
        await mkdir(TEST_WORKSPACE, { recursive: true });
    });

    afterEach(async () => {
        await rm(TEST_WORKSPACE, { recursive: true, force: true });
    });

    it('should save and load a configuration correctly including agents', async () => {
        const repo = new BunConfigRepository();

        // 1. Setup Data
        const manifest = SyncManifest.createEmpty();
        const rule = MappingRule.create({
            from: '.cursor/rules',
            to: '.ai/rules',
            format: MappingFormat.DIRECTORY
        });

        const agent = Agent.create({
            id: 'cursor',
            name: 'Cursor',
            sourceRoot: '.cursor',
            inbound: [rule],
            outbound: [rule]
        });

        const config = Configuration.create({
            workspaceRoot: TEST_WORKSPACE,
            agents: [agent],
            manifest
        });

        // 2. Save
        await repo.save(config);

        // 3. Load
        const loadedConfig = await repo.load(TEST_WORKSPACE);

        // 4. Verification
        expect(loadedConfig.workspaceRoot).toBe(TEST_WORKSPACE);
        expect(loadedConfig.agents).toHaveLength(1);
        expect(loadedConfig.agents[0]!.id).toBe('cursor');
        expect(loadedConfig.agents[0]!.inboundRules).toHaveLength(1);
        expect(loadedConfig.agents[0]!.inboundRules[0]!.from).toBe('.cursor/rules');
        expect(loadedConfig.manifest.lastActiveAgent).toBe('none');
    });

    it('should throw an error when loading a non-existent configuration', async () => {
        const repo = new BunConfigRepository();
        expect(repo.load(join(TEST_WORKSPACE, 'non_existent'))).rejects.toThrow();
    });
});
