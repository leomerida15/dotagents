import {
	SyncProjectUseCase,
	DefaultSyncInterpreter,
	JsonSyncInterpreter,
	CompositeSyncInterpreter,
	type ISyncProject,
	type SyncProjectRequestDTO,
	type SyncResultDTO,
	type MappingRuleDTO,
} from '@dotagents/diff';
import { type IDiffSyncEngine } from '../app/ports/IDiffSyncEngine';
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

	/**
	 * Constructs the DiffSyncAdapter with the given configuration and logger.
	 * @param props - Configuration object containing configRepository and optional logger.
	 */
	constructor({ configRepository, logger }: DiffSyncAdapterProps) {
		this.configRepository = configRepository;
		this.logger = logger;
		this.fileSystem = new NodeFileSystem();

		const defaultInterpreter = new DefaultSyncInterpreter();
		const jsonInterpreter = new JsonSyncInterpreter();
		const compositeInterpreter = new CompositeSyncInterpreter({
			defaultInterpreter,
			jsonInterpreter,
		});

		this.syncProject = new SyncProjectUseCase({
			interpreter: compositeInterpreter,
			fileSystem: this.fileSystem,
		});
	}

	/**
	 * Executes the sync project use case with the given request.
	 * @param request - The sync project request containing rules and paths.
	 * @returns The result of the sync operation.
	 */
	async execute(request: SyncProjectRequestDTO): Promise<SyncResultDTO> {
		return this.syncProject.execute(request);
	}

	/**
	 * Detects the current agent from workspace markers.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns The agent ID if found, null otherwise.
	 */
	private detectCurrentAgentFromWorkspace(workspaceRoot: string): string | null {
		for (const { id, dir } of WORKSPACE_AGENT_MARKERS) {
			if (existsSync(join(workspaceRoot, dir))) return id;
		}
		return null;
	}

	/**
	 * Synchronizes all installed agents in the workspace.
	 * @param workspaceRoot - The root directory of the workspace.
	 */
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
				rules: rule.mappings.inbound as unknown as MappingRuleDTO[],
				sourcePath: join(workspaceRoot, rule.sourceRoot),
				targetPath: join(workspaceRoot, '.agents'),
			});
			lastSyncedAgentId = rule.id;
		}

		// 3. Update manifest (currentAgent, timestamps) – always set so it is never null after sync
		const agentToSet =
			lastSyncedAgentId ??
			this.detectCurrentAgentFromWorkspace(workspaceRoot) ??
			detectAgentFromHostApp();
		try {
			const config = await this.configRepository.load(workspaceRoot);
			// For syncAll, we always update bridge state since this is a full sync operation
			config.manifest.updateBridgeState(agentToSet, true);
			await this.configRepository.save(config);
			if (this.logger)
				this.logger.info(
					'[DiffSyncAdapter] currentAgent set to',
					agentToSet,
					'workspaceRoot',
					workspaceRoot,
				);
		} catch (e) {
			if (this.logger)
				this.logger.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
			else console.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
		}
	}

	/**
	 * Synchronizes a specific agent's rules to the workspace.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @param agentId - The ID of the agent to sync.
	 * @param affectedPaths - Optional list of affected paths to optimize sync.
	 * @returns Object containing the list of written paths.
	 */
	async syncAgent(
		workspaceRoot: string,
		agentId: string,
		affectedPaths?: string[],
	): Promise<{ writtenPaths: string[] }> {
		const listRules = ClientModule.createListInstalledRulesUseCase(
			join(workspaceRoot, '.agents', '.ai', 'rules'),
		);
		const rules = await listRules.execute();
		const rule = rules.find((item) => item.id === agentId);

		let writtenPaths: string[] = [];
		let hadChanges = false;
		if (rule) {
			const result = await this.syncProject.execute({
				rules: rule.mappings.inbound as unknown as MappingRuleDTO[],
				sourcePath: join(workspaceRoot, rule.sourceRoot),
				targetPath: join(workspaceRoot, '.agents'),
				...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
			});
			writtenPaths = this.extractWrittenPaths(result);
			hadChanges = result.actionsPerformed.length > 0;
		}

		try {
			const config = await this.configRepository.load(workspaceRoot);
			const currentAgent = config.manifest.currentAgent;
			const agentChanged = agentId !== currentAgent;

			if (hadChanges || agentChanged) {
				// Update bridge state (lastProcessedAt and currentAgent) when:
				// - There were actual changes (hadChanges), OR
				// - We switched to a different agent
				config.manifest.updateBridgeState(agentId, hadChanges);
			} else {
				// Only update agent tracking timestamp when:
				// - No changes AND same agent (just heartbeat/update tracking)
				config.manifest.updateAgentTrackOnly(agentId);
			}
			await this.configRepository.save(config);
			if (this.logger)
				this.logger.info(
					'[DiffSyncAdapter] currentAgent set to',
					agentId,
					'workspaceRoot',
					workspaceRoot,
				);
		} catch (e) {
			if (this.logger)
				this.logger.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
			else console.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
		}
		return { writtenPaths };
	}

	/**
	 * Synchronizes rules from the workspace back to the agent's source root (outbound).
	 * @param workspaceRoot - The root directory of the workspace.
	 * @param agentId - The ID of the agent to sync.
	 * @param affectedPaths - Optional list of affected paths to optimize sync.
	 * @returns Object containing the list of written paths.
	 */
	async syncOutboundAgent(
		workspaceRoot: string,
		agentId: string,
		affectedPaths?: string[],
	): Promise<{ writtenPaths: string[] }> {
		const listRules = ClientModule.createListInstalledRulesUseCase(
			join(workspaceRoot, '.agents', '.ai', 'rules'),
		);
		const rules = await listRules.execute();
		const rule = rules.find((item) => item.id === agentId);

		let writtenPaths: string[] = [];
		let hadChanges = false;
		if (rule) {
			const result = await this.syncProject.execute({
				rules: rule.mappings.inbound as unknown as MappingRuleDTO[],
				sourcePath: join(workspaceRoot, rule.sourceRoot),
				targetPath: join(workspaceRoot, '.agents'),
				...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
			});
			writtenPaths = this.extractWrittenPaths(result);
			hadChanges = result.actionsPerformed.length > 0;
		}

		try {
			const config = await this.configRepository.load(workspaceRoot);
			const currentAgent = config.manifest.currentAgent;
			const agentChanged = agentId !== currentAgent;

			if (hadChanges || agentChanged) {
				// Update bridge state (lastProcessedAt and currentAgent) when:
				// - There were actual changes (hadChanges), OR
				// - We switched to a different agent
				config.manifest.updateBridgeState(agentId, hadChanges);
			} else {
				// Only update agent tracking timestamp when:
				// - No changes AND same agent (just heartbeat/update tracking)
				config.manifest.updateAgentTrackOnly(agentId);
			}
			await this.configRepository.save(config);
			if (this.logger)
				this.logger.info(
					'[DiffSyncAdapter] currentAgent set to',
					agentId,
					'workspaceRoot',
					workspaceRoot,
				);
		} catch (e) {
			if (this.logger)
				this.logger.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
			else console.error('[DiffSyncAdapter] Failed to update manifest currentAgent:', e);
		}

		return { writtenPaths };
	}

	/**
	 * Synchronizes a new agent (both inbound and outbound).
	 * @param workspaceRoot - The root directory of the workspace.
	 * @param agentId - The ID of the new agent to sync.
	 * @returns Object containing the combined list of written paths.
	 */
	async syncNew(workspaceRoot: string, agentId: string): Promise<{ writtenPaths: string[] }> {
		const { writtenPaths: outPaths } = await this.syncOutboundAgent(workspaceRoot, agentId);
		const { writtenPaths: inPaths } = await this.syncAgent(workspaceRoot, agentId);
		return { writtenPaths: [...outPaths, ...inPaths] };
	}

	/**
	 * Extracts the list of written file paths from a sync result.
	 * @param result - The sync result containing actions performed.
	 * @returns Array of written file paths.
	 */
	private extractWrittenPaths(result: SyncResultDTO): string[] {
		const paths: string[] = [];
		for (const action of result.actionsPerformed) {
			if (action.target) paths.push(action.target);
		}
		return paths;
	}
}
