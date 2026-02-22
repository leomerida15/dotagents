import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { IConfigRepository, ISyncProject, IFileSystem } from '@dotagents/diff';
import type { ILogger } from './ports/ILogger';
import { ClientModule } from '@dotagents/rule';
import { WORKSPACE_AGENT_MARKERS } from '../domain/WorkspaceAgents';

export interface MigrateExistingAgentsInput {
	workspaceRoot: string;
	/** When set, migrate only this agent (must have local rules file). */
	selectedAgentId?: string;
}

export interface MigratedAgent {
	agentId: string;
	dir: string;
}

export interface MigrateExistingAgentsResult {
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
				if (this.logger) this.logger.info('Migration: selected agent not found in workspace');
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
			const rules = rule?.mappings.inbound ?? [];
			if (rules.length === 0) {
				if (selectedAgentId === agentId) {
					if (this.logger) this.logger.warn(`Migration: no local rules for selected agent ${agentId}`);
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
}
