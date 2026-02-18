import { join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { Agent, Configuration, IConfigRepository, MappingRule, SyncManifest } from '@dotagents/diff';


interface NodeConfigRepositoryProps {
    dotAgentsFolder?: string;
    syncFile?: string;
}

interface PersistedConfigData {
    manifest: any;
    agents: any[];
}

export class NodeConfigRepository implements IConfigRepository {
    private readonly DOT_AGENTS_FOLDER: string;
    private readonly SYNC_FILE: string;

    constructor({
        dotAgentsFolder = '.agents',
        syncFile = 'state.json',
    }: NodeConfigRepositoryProps = {}) {
        this.DOT_AGENTS_FOLDER = dotAgentsFolder;
        this.SYNC_FILE = syncFile;
    }

    public async save(config: Configuration): Promise<void> {
        const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
        const syncPath = join(agentsPath, this.SYNC_FILE);

        await mkdir(agentsPath, { recursive: true });

        // Create .agents/.ai for rule storage (used by @dotagents/rule)
        await mkdir(join(agentsPath, '.ai'), { recursive: true });
        await mkdir(join(agentsPath, '.ai', 'rules'), { recursive: true });

        const data: PersistedConfigData = {
            manifest: config.manifest.toJSON(),
            agents: config.agents.map((agent) => ({
                id: agent.id,
                name: agent.name,
                sourceRoot: agent.sourceRoot,
                inbound: agent.inboundRules.map((r) => ({
                    from: r.from,
                    to: r.to,
                    format: r.format,
                })),
                outbound: agent.outboundRules.map((r) => ({
                    from: r.from,
                    to: r.to,
                    format: r.format,
                })),
            })),
        };

        await writeFile(syncPath, JSON.stringify(data, null, 2));

        await mkdir(join(agentsPath, 'rules'), { recursive: true });
        await mkdir(join(agentsPath, 'skills'), { recursive: true });
        await mkdir(join(agentsPath, 'mcp'), { recursive: true });
    }

    public async load(workspaceRoot: string): Promise<Configuration> {
        const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, this.SYNC_FILE);

        try {
            const fileContent = await readFile(syncPath, 'utf8');
            const data = JSON.parse(fileContent) as PersistedConfigData;

            const manifest = SyncManifest.create(data.manifest);

            const agents = (data.agents || []).map((agentProps) => {
                return Agent.create({
                    ...agentProps,
                    inbound: (agentProps.inbound || []).map((r: any) => MappingRule.create(r)),
                    outbound: (agentProps.outbound || []).map((r: any) => MappingRule.create(r)),
                });
            });

            return Configuration.create({
                workspaceRoot,
                agents,
                manifest,
            });
        } catch (error) {
            // Instead of throwing immediately, verify if file exists. If not found, return null or throw specific error?
            // The interface implies returning Configuration.
            // InitializeProjectUseCase will use load? No, it uses save.
            // But StartSync uses load.
            throw new Error(`Could not load configuration from ${syncPath}: ${error}`);
        }
    }

    /**
     * Ensures .agents/.ai structure exists (for projects already initialized).
     * Call before sync when .agents exists but .ai may not.
     */
    public async ensureAIStructure(workspaceRoot: string): Promise<void> {
        const agentsPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER);
        await mkdir(join(agentsPath, '.ai'), { recursive: true });
        await mkdir(join(agentsPath, '.ai', 'rules'), { recursive: true });
    }

    /**
     * Checks if the configuration exists.
     */
    public async exists(workspaceRoot: string): Promise<boolean> {
        const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, this.SYNC_FILE);
        try {
            await readFile(syncPath);
            return true;
        } catch {
            return false;
        }
    }
}
