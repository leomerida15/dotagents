import type { IConfigRepository } from '@diff/modules/config/domain/ports/IConfigRepository';
import type { IPullOutbound } from '../ports/IPullOutbound';
import type { Agent } from '@diff/modules/config/domain/entities/Agent';
import type { IFileSystem } from '@diff/modules/sync/domain/ports/IFileSystem';
import type { ISyncInterpreter } from '@diff/modules/sync/domain/ports/ISyncInterpreter';
import { SyncResult } from '@diff/modules/sync/domain/value-objects/SyncResult';
import { SyncAction } from '@diff/modules/sync/domain/entities/SyncAction';
import { join } from 'node:path';
import type { PullOutboundRequestDTO } from '@diff/modules/sync/app/dtos/PullOutboundRequestDTO';
import type { SyncResultDTO } from '@diff/modules/sync/app/dtos/SyncResultDTO';
import { SyncMapper } from '@diff/modules/sync/app/mappers/SyncMapper';

export interface PullOutboundProps {
	interpreter: ISyncInterpreter;
	fileSystem: IFileSystem;
	configRepository: IConfigRepository;
}

/**
 * Use case to pull updates from the .agents bridge to a specific agent.
 * Usually triggered when an agent becomes active and its files are outdated compared to the .agents bridge.
 */
export class PullOutboundUseCase implements IPullOutbound {
	private interpreter: ISyncInterpreter;
	private fileSystem: IFileSystem;
	private configRepository: IConfigRepository;

	constructor({ interpreter, fileSystem, configRepository }: PullOutboundProps) {
		this.interpreter = interpreter;
		this.fileSystem = fileSystem;
		this.configRepository = configRepository;
	}

	/**
	 * Executes the pull process from .agents standard to the agent's specific folder.
	 * @param request The agent ID and workspace root via DTO.
	 */
	async execute({ agentId, workspaceRoot }: PullOutboundRequestDTO): Promise<SyncResultDTO> {
		const startedAt = Date.now();
		const allActions: SyncAction[] = [];

		try {
			// 1. Load current configuration
			const configuration = await this.configRepository.load(workspaceRoot);
			const agent = configuration.agents.find((a: Agent) => a.id === agentId);

			if (!agent) {
				throw new Error(`Agent with ID ${agentId} not found in configuration`);
			}

			// 2. Check if sync is actually needed using the manifest heartbeats
			if (!configuration.manifest.needsSync(agentId)) {
				return SyncMapper.toResultDTO(SyncResult.createSuccess([], startedAt));
			}

			// 3. Perform Outbound Sync: .agents Bridge -> Agent
			const outboundActions = await this.processRules(
				agent.outboundRules,
				join(workspaceRoot, '.agents'),
				join(workspaceRoot, agent.sourceRoot),
			);
			allActions.push(...outboundActions);

			// 4. Mark agent as synced with the current state
			configuration.manifest.markAsSynced(agentId);

			// 5. Persist the updated state
			await this.configRepository.save(configuration);

			const result = SyncResult.createSuccess(allActions, startedAt);
			return SyncMapper.toResultDTO(result);
		} catch (error) {
			const result = SyncResult.createFailure(error as Error, startedAt);
			return SyncMapper.toResultDTO(result);
		}
	}

	/**
	 * Resolves rules into actions and applies them to the file system.
	 */
	private async processRules(
		rules: any[],
		sourceRoot: string,
		targetRoot: string,
	): Promise<SyncAction[]> {
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
