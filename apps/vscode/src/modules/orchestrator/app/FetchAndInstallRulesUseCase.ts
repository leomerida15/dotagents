import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { IRuleProvider } from '@dotagents/diff';
import type { IConfigRepository } from '@dotagents/diff';
import type { ILogger } from './ports/ILogger';

export interface FetchAndInstallRulesUseCaseProps {
	ruleProvider: IRuleProvider;
	configRepository: IConfigRepository;
	dotAgentsFolder?: string;
	logger?: ILogger;
}

/**
 * Fetches rules from GitHub for each detected agent and persists them to .agents/.ai/rules/.
 */
export class FetchAndInstallRulesUseCase {
	private readonly ruleProvider: IRuleProvider;
	private readonly configRepository: IConfigRepository;
	private readonly dotAgentsFolder: string;
	private readonly logger: ILogger | undefined;

	constructor({
		ruleProvider,
		configRepository,
		dotAgentsFolder = '.agents',
		logger,
	}: FetchAndInstallRulesUseCaseProps) {
		this.ruleProvider = ruleProvider;
		this.configRepository = configRepository;
		this.dotAgentsFolder = dotAgentsFolder;
		this.logger = logger;
	}

	async execute(workspaceRoot: string): Promise<void> {
		const config = await this.configRepository.load(workspaceRoot);
		const rulesDir = join(workspaceRoot, this.dotAgentsFolder, '.ai', 'rules');
		await mkdir(rulesDir, { recursive: true });

		for (const agent of config.agents) {
			try {
				const content = await this.ruleProvider.fetchRuleRaw(agent.id);
				if (content && content.trim()) {
					const filePath = join(rulesDir, `${agent.id}.yaml`);
					await writeFile(filePath, content, 'utf-8');
					if (this.logger) this.logger.info(`Installed rule for ${agent.id}`);
					else console.log(`Installed rule for ${agent.id}`);
				}
			} catch (error: any) {
				if (this.logger) this.logger.warn(`Could not install rule for ${agent.id}:`, error.message);
				else console.warn(`Could not install rule for ${agent.id}:`, error.message);
			}
		}
	}
}
