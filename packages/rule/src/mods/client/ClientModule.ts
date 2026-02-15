import { GetInstalledRuleUseCase } from './app/use-cases/GetInstalledRuleUseCase';
import { ListInstalledRulesUseCase } from './app/use-cases/ListInstalledRulesUseCase';
import { FsInstalledRuleRepository } from './infra/repo/FsInstalledRuleRepository';
import { join } from 'node:path';

export class ClientModule {
	/**
	 * Creates a configured instance of GetInstalledRuleUseCase.
	 *
	 * @param basePath Optional path to .agents/.ai directory
	 */
	static createGetInstalledRuleUseCase(basePath?: string): GetInstalledRuleUseCase {
		const path = basePath || join(process.cwd(), '.agents', '.ai');
		const repository = new FsInstalledRuleRepository(path);
		return new GetInstalledRuleUseCase(repository);
	}

	/**
	 * Creates a configured instance of ListInstalledRulesUseCase.
	 *
	 * @param basePath Optional path to .agents/.ai directory
	 */
	static createListInstalledRulesUseCase(basePath?: string): ListInstalledRulesUseCase {
		const path = basePath || join(process.cwd(), '.agents', '.ai');
		const repository = new FsInstalledRuleRepository(path);
		return new ListInstalledRulesUseCase(repository);
	}
}
