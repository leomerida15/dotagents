import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { IConfigRepository, ISyncProject, IFileSystem } from '@dotagents/diff';
import type { ILogger } from './ports/ILogger';
import { WORKSPACE_AGENT_MARKERS, DEFAULT_MIGRATION_RULES } from '../domain/WorkspaceAgents';

export interface MigrateExistingAgentsInput {
	workspaceRoot: string;
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
 * Migrates existing IDE agent folders (.cursor, .cline, etc.) into .agents/<agentId>
 * when .agents does not exist yet. Runs before InitializeProjectUseCase.
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
		const { workspaceRoot } = input;

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

		if (present.length === 0) {
			if (this.logger) this.logger.info('Migration: no IDE folders found');
			return { migrated: [] };
		}

		// Create minimal .agents structure (do not create state.json)
		const aiPath = join(workspaceRoot, '.agents', '.ai');
		await this.fileSystem.mkdir(aiPath);

		for (const { agentId, dir } of present) {
			const rules = DEFAULT_MIGRATION_RULES[agentId] ?? [];
			if (rules.length === 0) continue;

			const sourcePath = join(workspaceRoot, dir);
			const targetPath = join(workspaceRoot, '.agents', agentId);

			if (this.logger) this.logger.info(`Migration: copying ${dir} → .agents/${agentId}`);
			await this.syncProject.execute({
				rules,
				sourcePath,
				targetPath,
			});
		}

		return { migrated: present };
	}
}
