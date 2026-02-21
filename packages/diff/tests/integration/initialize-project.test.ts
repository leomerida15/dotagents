
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, readdir, readFile, mkdir } from 'fs/promises';
import { InitializeProjectUseCase } from '../../src/index';
import { TestAgentScanner, TestConfigRepository } from '../helpers/TestAdapters';

// Mock RuleProvider since it's an external dependency we don't need for structure tests
class MockRuleProvider {
    async fetchAgentDefinitions() { return {}; }
    async getRulesSource() { return {}; }
    async fetchRuleRaw() { return ''; }
}

describe('InitializeProjectUseCase - Integration', () => {
    let tempDir: string;
    let useCase: InitializeProjectUseCase;

    beforeEach(async () => {
        console.log('SETUP START');
        tempDir = await mkdtemp(join(tmpdir(), 'dotagents-test-int-'));
        console.log('TEMP DIR:', tempDir);

        const agentScanner = new TestAgentScanner(tempDir);
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

    it('debe crear la estructura .agents/ correctamente', async () => {
        // Execute
        await useCase.execute({ workspaceRoot: tempDir, force: false });

        // Verify .agents exists
        const agentsPath = join(tempDir, '.agents', '.ai');
        const files = await readdir(agentsPath);
        expect(files).toContain('state.json');
        expect(files).toContain('rules');
        expect(files).toContain('skills');
        expect(files).toContain('mcp');
    });

    it('debe generar state.json con la estructura correcta', async () => {
        await useCase.execute({ workspaceRoot: tempDir, force: false });

        const statePath = join(tempDir, '.agents', '.ai', 'state.json');
        const content = await readFile(statePath, 'utf-8');
        const json = JSON.parse(content);

        expect(json).toHaveProperty('workspaceRoot', tempDir);
        expect(json).toHaveProperty('agents');
        expect(Array.isArray(json.agents)).toBe(true); // Agent[] is an array in Configuration
        expect(json).toHaveProperty('manifest');
        expect(json.manifest).toHaveProperty('agents'); // Manifest agents is a map
    });
});
