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
import { existsSync, readdirSync } from 'node:fs';
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

		// 2. Execute sync for each agent (skip if sourceRoot doesn't exist)
		let lastSyncedAgentId: string | null = null;
		for (const rule of rules) {
			const agentSourcePath = join(workspaceRoot, rule.sourceRoot);
			if (!existsSync(agentSourcePath)) {
				if (this.logger)
					this.logger.debug(
						'[DiffSyncAdapter] Skipping inbound sync for',
						rule.id,
						'- sourceRoot does not exist:',
						agentSourcePath,
					);
				continue;
			}
			await this.syncProject.execute({
				rules: rule.mappings.inbound as unknown as MappingRuleDTO[],
				sourcePath: agentSourcePath,
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
		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] === START SYNC INBOUND ===');
			this.logger.debug('[DiffSyncAdapter] workspaceRoot:', workspaceRoot);
			this.logger.debug('[DiffSyncAdapter] agentId:', agentId);
			this.logger.debug('[DiffSyncAdapter] affectedPaths:', affectedPaths);
		}

		const rulesPath = join(workspaceRoot, '.agents', '.ai', 'rules');

		if (this.logger) {
			try {
				const files = readdirSync(rulesPath);
				this.logger.debug('[DiffSyncAdapter] DIRECTORY SCAN:', files.join(', '));
			} catch (e) {
				this.logger.debug('[DiffSyncAdapter] DIRECTORY SCAN FAILED:', String(e));
			}
		}

		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] Loading rules from:', rulesPath);
		}

		const listRules = ClientModule.createListInstalledRulesUseCase(rulesPath);
		const rules = await listRules.execute();

		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] Rules loaded:', rules.length);
			this.logger.debug(
				'[DiffSyncAdapter] Available agents:',
				rules.map((r) => r.id),
			);
			this.logger.debug('[DiffSyncAdapter] Rules path:', rulesPath);
		}

		const rule = rules.find((item) => item.id === agentId);

		if (this.logger) {
			if (rule) {
				this.logger.debug('[DiffSyncAdapter] Rule found for agent:', agentId);
				this.logger.debug('[DiffSyncAdapter] sourceRoot:', rule.sourceRoot);
				this.logger.debug(
					'[DiffSyncAdapter] inbound mappings:',
					JSON.stringify(rule.mappings.inbound),
				);
			} else {
				this.logger.debug('[DiffSyncAdapter] NO RULE FOUND for agent:', agentId);
			}
		}

		let writtenPaths: string[] = [];
		let hadChanges = false;
		if (rule) {
			const sourcePath = join(workspaceRoot, rule.sourceRoot);
			if (!existsSync(sourcePath)) {
				if (this.logger)
					this.logger.debug(
						'[DiffSyncAdapter] Skipping inbound sync - sourceRoot does not exist:',
						sourcePath,
					);
			} else {
				const syncRequest = {
					rules: rule.mappings.inbound as unknown as MappingRuleDTO[],
					sourcePath,
					targetPath: join(workspaceRoot, '.agents'),
					...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
				};

				if (this.logger) {
					this.logger.debug(
						'[DiffSyncAdapter] Executing sync with request:',
						JSON.stringify(syncRequest, null, 2),
					);
				}

				const result = await this.syncProject.execute(syncRequest);

				if (this.logger) {
					this.logger.debug(
						'[DiffSyncAdapter] Sync result - actions performed:',
						result.actionsPerformed,
					);
				}
				if (result.status === 'failure' && result.errors?.length && this.logger) {
					this.logger.error('[DiffSyncAdapter] Sync failed:', result.errors.join('; '));
				}

				writtenPaths = this.extractWrittenPaths(result);
				hadChanges = result.actionsPerformed.length > 0;

				if (this.logger) {
					this.logger.debug('[DiffSyncAdapter] Written paths:', writtenPaths);
					this.logger.debug('[DiffSyncAdapter] Had changes:', hadChanges);
					this.logger.debug('[DiffSyncAdapter] === END SYNC INBOUND ===');
				}
			}
		} else {
			if (this.logger) {
				this.logger.debug('[DiffSyncAdapter] No rule found, skipping sync');
				this.logger.debug('[DiffSyncAdapter] === END SYNC INBOUND (NO RULE) ===');
			}
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
		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] === START SYNC OUTBOUND ===');
			this.logger.debug('[DiffSyncAdapter] workspaceRoot:', workspaceRoot);
			this.logger.debug('[DiffSyncAdapter] agentId:', agentId);
			this.logger.debug('[DiffSyncAdapter] affectedPaths:', affectedPaths);
		}

		const rulesPath = join(workspaceRoot, '.agents', '.ai', 'rules');
		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] Loading rules from:', rulesPath);
		}

		const listRules = ClientModule.createListInstalledRulesUseCase(rulesPath);
		const rules = await listRules.execute();

		if (this.logger) {
			this.logger.debug('[DiffSyncAdapter] Rules loaded:', rules.length);
			this.logger.debug(
				'[DiffSyncAdapter] Available agents:',
				rules.map((r) => r.id),
			);
			this.logger.debug('[DiffSyncAdapter] Rules path:', rulesPath);
		}

		const rule = rules.find((item) => item.id === agentId);

		if (this.logger) {
			if (rule) {
				this.logger.debug('[DiffSyncAdapter] Rule found for agent:', agentId);
				this.logger.debug('[DiffSyncAdapter] sourceRoot:', rule.sourceRoot);
				this.logger.debug(
					'[DiffSyncAdapter] outbound mappings:',
					JSON.stringify(rule.mappings.outbound),
				);
			} else {
				this.logger.debug('[DiffSyncAdapter] NO RULE FOUND for agent:', agentId);
			}
		}

		let writtenPaths: string[] = [];
		let hadChanges = false;
		if (rule) {
			const targetPath = join(workspaceRoot, rule.sourceRoot);
			if (!existsSync(targetPath)) {
				if (this.logger)
					this.logger.debug(
						'[DiffSyncAdapter] Skipping outbound sync - target sourceRoot does not exist:',
						targetPath,
					);
			} else {
				const syncRequest = {
					rules: rule.mappings.outbound as unknown as MappingRuleDTO[],
					sourcePath: join(workspaceRoot, '.agents'),
					targetPath,
					...(affectedPaths && affectedPaths.length > 0 ? { affectedPaths } : {}),
				};

				if (this.logger) {
					this.logger.debug(
						'[DiffSyncAdapter] Executing outbound sync with request:',
						JSON.stringify(syncRequest, null, 2),
					);
				}

				const result = await this.syncProject.execute(syncRequest);

				if (this.logger) {
					this.logger.debug(
						'[DiffSyncAdapter] Sync result - actions performed:',
						result.actionsPerformed,
					);
				}

				writtenPaths = this.extractWrittenPaths(result);
				hadChanges = result.actionsPerformed.length > 0;

				if (this.logger) {
					this.logger.debug('[DiffSyncAdapter] Written paths:', writtenPaths);
					this.logger.debug('[DiffSyncAdapter] Had changes:', hadChanges);
					this.logger.debug('[DiffSyncAdapter] === END SYNC OUTBOUND ===');
				}
			}
		} else {
			if (this.logger) {
				this.logger.debug('[DiffSyncAdapter] No rule found, skipping outbound sync');
				this.logger.debug('[DiffSyncAdapter] === END SYNC OUTBOUND (NO RULE) ===');
			}
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
