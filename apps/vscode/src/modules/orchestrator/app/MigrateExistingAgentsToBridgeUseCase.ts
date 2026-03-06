import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { IConfigRepository, ISyncProject, IFileSystem, MappingRuleDTO } from '@dotagents/diff';
import { MappingFormat } from '@dotagents/diff';
import type { ILogger } from './ports/ILogger';
import { ClientModule } from '@dotagents/rule';
import { WORKSPACE_AGENT_MARKERS } from '../domain/WorkspaceAgents';

/**
 * Input for executing the migration of existing IDE agent folders.
 */
export interface MigrateExistingAgentsInput {
	/** Workspace folder root containing legacy IDE agent directories. */
	workspaceRoot: string;
	/** When set, migrate only this agent (must have local rules file). */
	selectedAgentId?: string;
}

/**
 * Agent folder metadata produced by the migration process.
 */
export interface MigratedAgent {
	/** Unique identifier of the migrated agent. */
	agentId: string;
	/** Folder identifier used as source for migration. */
	dir: string;
}

/**
 * Result of a migration run.
 */
export interface MigrateExistingAgentsResult {
	/** List of agents successfully migrated into the bridge structure. */
	migrated: MigratedAgent[];
}

export interface MigrateExistingAgentsToBridgeUseCaseProps {
	configRepository: IConfigRepository;
	syncProject: ISyncProject;
	fileSystem: IFileSystem;
	logger?: ILogger;
}

/**
 * Migrates existing IDE agent folders (.cursor, .cline, etc.) into .agents/ (canonical bridge:
 * rules/, skills/, mcp/). Does NOT create per-agent subfolders. Runs before InitializeProjectUseCase.
 */
export class MigrateExistingAgentsToBridgeUseCase {
	private readonly configRepository: IConfigRepository;
	private readonly syncProject: ISyncProject;
	private readonly fileSystem: IFileSystem;
	private readonly logger: ILogger | undefined;

	constructor({
		configRepository,
		syncProject,
		fileSystem,
		logger,
	}: MigrateExistingAgentsToBridgeUseCaseProps) {
		this.configRepository = configRepository;
		this.syncProject = syncProject;
		this.fileSystem = fileSystem;
		this.logger = logger;
	}

	/**
	 * Executes the migration process for all relevant IDE agent folders.
	 *
	 * @param input Migration parameters including workspace root and optionally a specific agent to migrate
	 * @returns The list of migrated agents
	 */
	async execute(input: MigrateExistingAgentsInput): Promise<MigrateExistingAgentsResult> {
		const { workspaceRoot, selectedAgentId } = input;

		if (await this.configRepository.exists(workspaceRoot)) {
			if (this.logger) this.logger.info('Migration: skipped (.agents already exists)');
			return { migrated: [] };
		}

		const present: MigratedAgent[] = [];
		for (const { id, dir } of WORKSPACE_AGENT_MARKERS) {
			if (existsSync(join(workspaceRoot, dir))) {
				present.push({ agentId: id, dir });
			}
		}

		let toMigrate = present;
		if (selectedAgentId != null) {
			toMigrate = present.filter((p) => p.agentId === selectedAgentId);
			if (toMigrate.length === 0) {
				if (this.logger)
					this.logger.info('Migration: selected agent not found in workspace');
				return { migrated: [] };
			}
		}

		if (toMigrate.length === 0) {
			if (this.logger) this.logger.info('Migration: no IDE folders found');
			return { migrated: [] };
		}

		const rulesDir = join(workspaceRoot, '.agents', '.ai', 'rules');
		const getRule = ClientModule.createGetInstalledRuleUseCase(rulesDir);

		// Create minimal .agents structure (do not create state.json)
		const aiPath = join(workspaceRoot, '.agents', '.ai');
		await this.fileSystem.mkdir(aiPath);

		const migrated: MigratedAgent[] = [];
		for (const { agentId, dir } of toMigrate) {
			const rule = await getRule.execute(agentId);
			const rules = (rule?.mappings?.inbound ?? []).map<MappingRuleDTO>((ruleItem) => ({
				from: ruleItem.from,
				to: ruleItem.to,
				format: this.mapFormat(ruleItem.format),
				sourceExt: ruleItem.sourceExt,
				targetExt: ruleItem.targetExt,
			}));
			if (rules.length === 0) {
				if (selectedAgentId === agentId) {
					if (this.logger)
						this.logger.warn(`Migration: no local rules for selected agent ${agentId}`);
				}
				continue;
			}

			const sourcePath = join(workspaceRoot, dir);
			const targetPath = join(workspaceRoot, '.agents');

			if (this.logger) this.logger.info(`Migration: copying ${dir} → .agents (bridge)`);
			await this.syncProject.execute({
				rules,
				sourcePath,
				targetPath,
			});
			migrated.push({ agentId, dir });
		}

		return { migrated };
	}

	private mapFormat(format: string | undefined): MappingRuleDTO['format'] {
		if (!format) return undefined;
		const values = Object.values(MappingFormat) as string[];
		return values.includes(format) ? (format as MappingRuleDTO['format']) : undefined;
	}
}
