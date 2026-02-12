import { SyncResult } from '../../domain/value-objects/SyncResult';
import type { ISyncInterpreter } from '../../domain/ports/ISyncInterpreter';
import type { IFileSystem } from '../../domain/ports/IFileSystem';
import { SyncAction } from '../../domain/entities/SyncAction';
import { join } from 'path';
import type { IConfigRepository, Agent } from '@diff';
import type { SynchronizeAgentRequestDTO } from '../dtos/SynchronizeAgentRequestDTO';
import type { SyncResultDTO } from '../dtos/SyncResultDTO';
import { SyncMapper } from '../dtos/SyncMapper';

export interface SynchronizeAgentProps {
    interpreter: ISyncInterpreter;
    fileSystem: IFileSystem;
    configRepository: IConfigRepository;
}

/**
 * Use case to synchronize a specific agent's configuration.
 * It handles the full flow: Detection/Load -> Inbound Push -> Update Heartbeat.
 */
export class SynchronizeAgentUseCase {
    private interpreter: ISyncInterpreter;
    private fileSystem: IFileSystem;
    private configRepository: IConfigRepository;

    constructor({ interpreter, fileSystem, configRepository }: SynchronizeAgentProps) {
        this.interpreter = interpreter;
        this.fileSystem = fileSystem;
        this.configRepository = configRepository;
    }

    /**
     * Executes the synchronization logic for a given agent.
     * @param request The agent ID and workspace root via DTO.
     */
    async execute({ agentId, workspaceRoot }: SynchronizeAgentRequestDTO): Promise<SyncResultDTO> {
        const startedAt = Date.now();
        const allActions: SyncAction[] = [];

        try {
            // 1. Load current configuration
            const configuration = await this.configRepository.load(workspaceRoot);
            const agent = configuration.agents.find((a: Agent) => a.id === agentId);

            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found in configuration`);
            }

            // 2. Perform Inbound Sync: Agent -> .ai Bridge
            const inboundActions = await this.processRules(
                agent.inboundRules,
                join(workspaceRoot, agent.sourceRoot),
                join(workspaceRoot, '.ai')
            );
            allActions.push(...inboundActions);

            // 3. Update Sync Manifest (Heartbeat) as per standard
            configuration.manifest.markAsSynced(agentId);

            // 4. Save updated configuration
            await this.configRepository.save(configuration);

            const result = SyncResult.createSuccess(allActions, startedAt);
            return SyncMapper.toResultDTO(result);
        } catch (error) {
            const result = SyncResult.createFailure(error as Error, startedAt);
            return SyncMapper.toResultDTO(result);
        }
    }

    /**
     * Process a set of rules and execute the resulting actions.
     */
    private async processRules(rules: any[], sourceRoot: string, targetRoot: string): Promise<SyncAction[]> {
        const executedActions: SyncAction[] = [];
        for (const rule of rules) {
            const actions = await this.interpreter.interpret(rule, { sourceRoot, targetRoot });
            for (const action of actions) {
                await action.execute(this.fileSystem);
                executedActions.push(action);
            }
        }
        return executedActions;
    }
}
