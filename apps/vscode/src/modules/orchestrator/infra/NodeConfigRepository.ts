import { join } from 'node:path';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
// @ts-ignore: Suppress module resolution error if types are missing
import { Agent, AgentTimestamp, Configuration, IConfigRepository, MappingRule, SyncManifest } from '@dotagents/diff';

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

    private getSyncPath(workspaceRoot: string): string {
        return join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);
    }

    private getLegacySyncPath(workspaceRoot: string): string {
        return join(workspaceRoot, this.DOT_AGENTS_FOLDER, this.SYNC_FILE);
    }

    private async migrateLegacyState(workspaceRoot: string, fileContent: string): Promise<void> {
        const agentsPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER);
        const aiPath = join(agentsPath, '.ai');
        const syncPath = this.getSyncPath(workspaceRoot);
        const legacyPath = this.getLegacySyncPath(workspaceRoot);

        await mkdir(aiPath, { recursive: true });
        await writeFile(syncPath, fileContent);
        await unlink(legacyPath).catch(() => undefined);
    }

    public async save(config: Configuration): Promise<void> {
        const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
        const aiPath = join(agentsPath, '.ai');
        const syncPath = join(aiPath, this.SYNC_FILE);
        const legacyPath = join(agentsPath, this.SYNC_FILE);

        await mkdir(agentsPath, { recursive: true });

        // Create .agents/.ai for rule storage (used by @dotagents/rule)
        await mkdir(aiPath, { recursive: true });
        await mkdir(join(aiPath, 'rules'), { recursive: true });

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
        await unlink(legacyPath).catch(() => undefined);

        await mkdir(join(agentsPath, 'rules'), { recursive: true });
        await mkdir(join(agentsPath, 'skills'), { recursive: true });
        await mkdir(join(agentsPath, 'mcp'), { recursive: true });
    }

    public async load(workspaceRoot: string): Promise<Configuration> {
        const syncPath = this.getSyncPath(workspaceRoot);
        const legacyPath = this.getLegacySyncPath(workspaceRoot);
        let fileContent: string;
        let usedLegacy = false;
        try {
            fileContent = await readFile(syncPath, 'utf8');
        } catch (error) {
            try {
                fileContent = await readFile(legacyPath, 'utf8');
                usedLegacy = true;
            } catch (legacyError) {
                throw new Error(`Could not load configuration from ${syncPath}: ${error}`);
            }
        }
        try {
            const data = JSON.parse(fileContent) as PersistedConfigData;

            const rawAgents = data.manifest?.agents ?? {};
            const manifestAgents = Object.fromEntries(
                Object.entries(rawAgents)
                    .filter(([key]) => key !== 'agents')
                    .map(([key, val]) => [
                        key,
                        AgentTimestamp.create(val as { lastProcessedAt: number }),
                    ])
            );
            const manifest = SyncManifest.create({
                ...data.manifest,
                agents: manifestAgents,
            });

            const agents = (data.agents || []).map((agentProps) => {
                return Agent.create({
                    ...agentProps,
                    inbound: (agentProps.inbound || []).map((r: any) => MappingRule.create(r)),
                    outbound: (agentProps.outbound || []).map((r: any) => MappingRule.create(r)),
                });
            });

            const configuration = Configuration.create({
                workspaceRoot,
                agents,
                manifest,
            });
            if (usedLegacy) {
                await this.migrateLegacyState(workspaceRoot, fileContent);
            }
            return configuration;
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
        const syncPath = this.getSyncPath(workspaceRoot);
        const legacyPath = this.getLegacySyncPath(workspaceRoot);
        try {
            await readFile(syncPath);
            return true;
        } catch {
            try {
                await readFile(legacyPath);
                return true;
            } catch {
                return false;
            }
        }
    }
}
