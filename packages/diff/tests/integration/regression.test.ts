
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, readdir, mkdir, stat } from 'fs/promises';
import { InitializeProjectUseCase } from '../../src/index';
import { TestAgentScanner, TestConfigRepository } from '../helpers/TestAdapters';

class MockRuleProvider {
    async fetchAgentDefinitions() { return {}; }
    async getRulesSource() { return {}; }
    async fetchRuleRaw() { return ''; }
}

describe('Regression Tests - Issue #21526', () => {
    let tempDir: string;
    let useCase: InitializeProjectUseCase;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), 'dotagents-test-regr-'));

        // Create fake home structure for scanner
        const homeDir = join(tempDir, 'fake-home');
        await mkdir(homeDir, { recursive: true });

        // Create fake project structure
        await mkdir(join(tempDir, 'apps'), { recursive: true });
        await mkdir(join(tempDir, 'packages'), { recursive: true });

        const agentScanner = new TestAgentScanner(homeDir);
        const ruleProvider = new MockRuleProvider();

        useCase = new InitializeProjectUseCase({
            agentScanner,
            configRepository: new TestConfigRepository(),
            ruleProvider: ruleProvider as any
        });
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it('NO debe crear la carpeta .agents/.ai/', async () => {
        await useCase.execute({ workspaceRoot: tempDir, force: false });

        const aiPath = join(tempDir, '.agents', '.ai');
        // Expect to throw or return false for exists
        try {
            await stat(aiPath);
            throw new Error('.ai folder exists!');
        } catch (e: any) {
            expect(e.code).toBe('ENOENT');
        }
    });

    it('NO debe detectar carpetas apps/ o packages/ como agentes', async () => {
        // Execute
        const config = await useCase.execute({ workspaceRoot: tempDir, force: false });

        // Verify agents list
        const agentIds = config.agents.map(a => a.id);
        expect(agentIds).not.toContain('apps');
        expect(agentIds).not.toContain('packages');
    });
});
