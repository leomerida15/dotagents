
import { join } from 'path';
import { homedir } from 'os';
import { mkdir, readFile, writeFile, stat, readdir } from 'fs/promises';
import {
    IConfigRepository,
    Configuration,
    IAgentScanner,
    Agent,
    SyncManifest
} from '../../src/index';

export class TestConfigRepository implements IConfigRepository {
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
        await writeFile(syncPath, JSON.stringify(data, null, 2));
    }

    async load(workspaceRoot: string): Promise<Configuration> {
        const syncPath = join(workspaceRoot, '.agents', '.ai', this.SYNC_FILE);
        const content = await readFile(syncPath, 'utf-8');
        const data = JSON.parse(content);

        // Reconstruct Configuration (Simplified for test)
        // In a real scenario we would use Configuration.fromJSON or similar if available
        // For now we just return what we saved to verify persistence structure matches
        return data as any;
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

export class TestAgentScanner implements IAgentScanner {
    private readonly homeDir: string;

    constructor(homeDir?: string) {
        this.homeDir = homeDir || homedir();
    }

    async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        const detected: Agent[] = [];
        const KNOWN_AGENTS = ['cursor', 'antigravity', 'vscode']; // Added vscode for test

        // Check home dir
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
