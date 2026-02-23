import { SyncProjectUseCase, DefaultSyncInterpreter, type ISyncProject, type SyncProjectRequestDTO, type SyncResultDTO } from '@dotagents/diff';
import { IDiffSyncEngine } from '../app/ports/IDiffSyncEngine';
import type { ILogger } from '../app/ports/ILogger';
import { NodeFileSystem } from './NodeFileSystem';
import { NodeConfigRepository } from './NodeConfigRepository';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { ClientModule } from '@dotagents/rule';
import { WORKSPACE_AGENT_MARKERS } from '../domain/WorkspaceAgents';
import { detectAgentFromHostApp } from './AgentHostDetector';

export interface DiffSyncAdapterProps {
    configRepository: NodeConfigRepository;
    logger?: ILogger;
}

/**
 * Adapter that integrates @dotagents/diff and @dotagents/rule
 * to perform synchronization within the VSCode extension.
 */
export class DiffSyncAdapter implements IDiffSyncEngine, ISyncProject {
    private syncProject: SyncProjectUseCase;
    private fileSystem: NodeFileSystem;
    private configRepository: NodeConfigRepository;
    private logger: ILogger | undefined;

    constructor(props: DiffSyncAdapterProps) {
        this.configRepository = props.configRepository;
        this.logger = props.logger;
        this.fileSystem = new NodeFileSystem();
        this.syncProject = new SyncProjectUseCase({
            interpreter: new DefaultSyncInterpreter(),
            fileSystem: this.fileSystem,
        });
    }

    /** Exposes sync by rules/paths for migration use case. */
    async execute(request: SyncProjectRequestDTO): Promise<SyncResultDTO> {
        return this.syncProject.execute(request);
    }

    private detectCurrentAgentFromWorkspace(workspaceRoot: string): string | null {
        for (const { id, dir } of WORKSPACE_AGENT_MARKERS) {
            if (existsSync(join(workspaceRoot, dir))) return id;
        }
        return null;
    }

    async syncAll(workspaceRoot: string): Promise<void> {
        // 1. Get all installed rules using @dotagents/rule
        const listRules = ClientModule.createListInstalledRulesUseCase(
            join(workspaceRoot, '.agents', '.ai', 'rules'),
        );
        const rules = await listRules.execute();

        // 2. Execute sync for each agent
        let lastSyncedAgentId: string | null = null;
        for (const rule of rules) {
            await this.syncProject.execute({
                rules: rule.mappings.inbound,
                sourcePath: join(workspaceRoot, rule.sourceRoot),
                targetPath: join(workspaceRoot, '.agents'),
            });
            lastSyncedAgentId = rule.id;
        }

        // 3. Update manifest (currentAgent, timestamps) – always set so it is never null after sync
        const agentToSet =
            lastSyncedAgentId
            ?? this.detectCurrentAgentFromWorkspace(workspaceRoot)
            ?? detectAgentFromHostApp();
        try {
            const config = await this.configRepository.load(workspaceRoot);
            config.manifest.markAsSynced(agentToSet);
            await this.configRepository.save(config);
            if (this.logger) this.logger.info('[DiffSyncAdapter] currentAgent set to', agentToSet, 'workspaceRoot', workspaceRoot);
        } catch (e) {
            if (this.logger) this.logger.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
            else console.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
        }
    }

    async syncAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<{ writtenPaths: string[] }> {
        const listRules = ClientModule.createListInstalledRulesUseCase(
            join(workspaceRoot, '.agents', '.ai', 'rules'),
        );
        const rules = await listRules.execute();
        const rule = rules.find((item) => item.id === agentId);

        let writtenPaths: string[] = [];
        if (rule) {
            const result = await this.syncProject.execute({
                rules: rule.mappings.inbound,
                sourcePath: join(workspaceRoot, rule.sourceRoot),
                targetPath: join(workspaceRoot, '.agents'),
                ...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
            });
            writtenPaths = this.extractWrittenPaths(result);
        }

        try {
            const config = await this.configRepository.load(workspaceRoot);
            config.manifest.markAsSynced(agentId);
            await this.configRepository.save(config);
            if (this.logger) this.logger.info('[DiffSyncAdapter] currentAgent set to', agentId, 'workspaceRoot', workspaceRoot);
        } catch (e) {
            if (this.logger) this.logger.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
            else console.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
        }
        return { writtenPaths };
    }

    async syncOutboundAgent(workspaceRoot: string, agentId: string, affectedPaths?: string[]): Promise<{ writtenPaths: string[] }> {
        const listRules = ClientModule.createListInstalledRulesUseCase(
            join(workspaceRoot, '.agents', '.ai', 'rules'),
        );
        const rules = await listRules.execute();
        const rule = rules.find((item) => item.id === agentId);

        let writtenPaths: string[] = [];
        if (rule && rule.mappings.outbound?.length) {
            const result = await this.syncProject.execute({
                rules: rule.mappings.outbound,
                sourcePath: join(workspaceRoot, '.agents'),
                targetPath: join(workspaceRoot, rule.sourceRoot),
                ...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
            });
            writtenPaths = this.extractWrittenPaths(result);
        }

        try {
            const config = await this.configRepository.load(workspaceRoot);
            config.manifest.markAsSynced(agentId);
            await this.configRepository.save(config);
            if (this.logger) this.logger.info('[DiffSyncAdapter] syncOutboundAgent done', agentId, 'workspaceRoot', workspaceRoot);
        } catch (e) {
            if (this.logger) this.logger.error('[DiffSyncAdapter] Failed to update manifest after syncOutboundAgent:', e);
            else console.error('[DiffSyncAdapter] Failed to update manifest after syncOutboundAgent:', e);
        }
        return { writtenPaths };
    }

    async syncNew(workspaceRoot: string, agentId: string): Promise<{ writtenPaths: string[] }> {
        const { writtenPaths: outPaths } = await this.syncOutboundAgent(workspaceRoot, agentId);
        const { writtenPaths: inPaths } = await this.syncAgent(workspaceRoot, agentId);
        return { writtenPaths: [...outPaths, ...inPaths] };
    }

    private extractWrittenPaths(result: SyncResultDTO): string[] {
        const paths: string[] = [];
        for (const action of result.actionsPerformed) {
            if (action.target) paths.push(action.target);
        }
        return paths;
    }
}
