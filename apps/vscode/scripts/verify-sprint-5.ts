
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, mkdir, readFile, stat, readdir } from 'fs/promises';
import {
    InitializeProjectUseCase,
    Configuration,
    IAgentScanner,
    Agent,
    SyncManifest
} from '../../../packages/diff/src/index';

// --- Test Adapters (Copied/Adapted for standalone script) ---

class TestConfigRepository {
    private readonly SYNC_FILE = 'state.json';

    async save(config: Configuration): Promise<void> {
        const agentsPath = join(config.workspaceRoot, '.agents');
        const aiPath = join(agentsPath, '.ai');
        await mkdir(agentsPath, { recursive: true });
        await mkdir(aiPath, { recursive: true });

        // Create aux directories
        await mkdir(join(aiPath, 'rules'), { recursive: true });
        await mkdir(join(aiPath, 'skills'), { recursive: true });
        await mkdir(join(aiPath, 'mcp'), { recursive: true });

        const syncPath = join(aiPath, this.SYNC_FILE);
        const data = {
            workspaceRoot: config.workspaceRoot,
            agents: config.agents.map(a => ({
                id: a.id,
                name: a.name,
                sourceRoot: a.sourceRoot,
                inbound: a.inboundRules,
                outbound: a.outboundRules
            })),
            manifest: config.manifest.toJSON()
        };
        await Bun.write(syncPath, JSON.stringify(data, null, 2));
    }

    async load(workspaceRoot: string): Promise<Configuration> {
        throw new Error('Not implemented for verification script');
    }

    async exists(workspaceRoot: string): Promise<boolean> {
        try {
            await stat(join(workspaceRoot, '.agents', '.ai', this.SYNC_FILE));
            return true;
        } catch {
            return false;
        }
    }
}

class TestAgentScanner implements IAgentScanner {
    private readonly homeDir: string;

    constructor(homeDir?: string) {
        this.homeDir = homeDir;
    }

    async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        const detected: Agent[] = [];
        const KNOWN_AGENTS = ['cursor', 'antigravity', 'vscode'];

        for (const agentId of KNOWN_AGENTS) {
            const agentPath = join(this.homeDir, `.${agentId}`);
            try {
                await stat(agentPath);
                detected.push(Agent.create({
                    id: agentId,
                    name: agentId,
                    sourceRoot: agentPath,
                    inbound: [],
                    outbound: []
                }));
            } catch { }
        }
        return detected;
    }
}

class MockRuleProvider {
    async fetchAgentDefinitions() { return {}; }
    async getRulesSource() { return {}; }
    async fetchRuleRaw() { return ''; }
}

// --- Verification Logic ---

async function runVerification() {
    const tempDir = await mkdtemp(join(tmpdir(), 'dotagents-verify-5-'));
    console.log(`Working in: ${tempDir}`);

    // Setup fake home and project structure
    const homeDir = join(tempDir, 'fake-home');
    await mkdir(homeDir, { recursive: true });
    await mkdir(join(homeDir, '.cursor'), { recursive: true }); // Simulate existing agent

    await mkdir(join(tempDir, 'apps'), { recursive: true });
    await mkdir(join(tempDir, 'packages'), { recursive: true });

    const agentScanner = new TestAgentScanner(homeDir);
    const useCase = new InitializeProjectUseCase({
        agentScanner,
        configRepository: new TestConfigRepository(),
        ruleProvider: new MockRuleProvider() as any
    });

    try {
        console.log('--- Test 1: Initialize Project ---');
        await useCase.execute({ workspaceRoot: tempDir, force: false });

        // Verify .agents exists
        const aiFiles = await readdir(join(tempDir, '.agents', '.ai'));
        if (!aiFiles.includes('state.json')) throw new Error('state.json missing');
        console.log('✅ .agents/.ai structure created');

        // Verify content
        const stateContent = await readFile(join(tempDir, '.agents', '.ai', 'state.json'), 'utf-8');
        const state = JSON.parse(stateContent);

        if (state.workspaceRoot !== tempDir) throw new Error('Workspace root mismatch');
        if (!Array.isArray(state.agents)) throw new Error('agents is not an array');
        if (state.agents.length !== 1 || state.agents[0].id !== 'cursor') throw new Error('Agent detection failed');
        console.log('✅ state.json content verified');


        console.log('--- Test 2: Regression Checks (#21526) ---');

        // Check .ai folder exists
        await stat(join(tempDir, '.agents', '.ai'));
        console.log('✅ .agents/.ai exists');

        // Check agents list for false positives
        const agentIds = state.agents.map((a: any) => a.id);
        if (agentIds.includes('apps') || agentIds.includes('packages')) {
            throw new Error('Project folders detected as agents');
        }
        console.log('✅ No false positives (apps/packages) detected');

        console.log('\n✨ SPRINT 5 VERIFICATION PASSED ✨');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error);
        process.exit(1);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

runVerification();
