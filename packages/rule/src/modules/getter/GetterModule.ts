
import { join } from 'node:path';
import { EnvConfigAdapter, FsRuleRepository, GitHubRuleProvider, LocalRuleProvider } from './infra';
import { GetAgentRuleUseCase } from './app';

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
		const ruleRepository = new FsRuleRepository(storagePath);

		return new GetAgentRuleUseCase(
			configService,
			githubProvider,
			localProvider,
			ruleRepository,
		);
	}
}
