import { GetAgentRuleUseCase } from './application/use-cases/GetAgentRuleUseCase';
import { EnvConfigAdapter } from './infrastructure/config/EnvConfigAdapter';
import { GitHubRuleProvider } from './infrastructure/providers/GitHubRuleProvider';
import { LocalRuleProvider } from './infrastructure/providers/LocalRuleProvider';
import { BunRuleRepository } from './infrastructure/repositories/BunRuleRepository';
import { join } from 'path';

export class GetterModule {
	/**
	 * Creates a configured instance of GetAgentRuleUseCase.
	 *
	 * @param configOverrides Optional overrides for configuration (useful for testing)
	 */
	static createGetAgentRuleUseCase(configOverrides?: any): GetAgentRuleUseCase {
		const configService = new EnvConfigAdapter();

		// Providers
		const githubProvider = new GitHubRuleProvider(configService.getGitHubRepoUrl());
		const localProvider = new LocalRuleProvider(configService.getLocalRulesPath());

		// Repository
		// For now, we hardcode the storage path to .agents/.ai relative to CWD
		// In a real app, this might also come from config
		const storagePath = join(process.cwd(), '.agents', '.ai');
		const ruleRepository = new BunRuleRepository(storagePath);

		return new GetAgentRuleUseCase(
			configService,
			githubProvider,
			localProvider,
			ruleRepository,
		);
	}
}
