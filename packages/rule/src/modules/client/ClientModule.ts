import { GetInstalledRuleUseCase } from './app/use-cases/GetInstalledRuleUseCase';
import { ListInstalledRulesUseCase } from './app/use-cases/ListInstalledRulesUseCase';
import { VerifyRuleExistsUseCase } from './app/use-cases/VerifyRuleExistsUseCase';
import { VerifyRulesExistenceUseCase } from './app/use-cases/VerifyRulesExistenceUseCase';
import { FsInstalledRuleRepository } from './infra/repo/FsInstalledRuleRepository';
import { join } from 'node:path';

export class ClientModule {
	/**
	 * Creates a configured instance of GetInstalledRuleUseCase.
	 *
	 * @param basePath Optional path to rules directory (defaults to .agents/rules)
	 */
	static createGetInstalledRuleUseCase(basePath?: string): GetInstalledRuleUseCase {
		const path = basePath || join(process.cwd(), '.agents', 'rules');
		const repository = new FsInstalledRuleRepository({ basePath: path });
		return new GetInstalledRuleUseCase(repository);
	}

	/**
	 * Creates a configured instance of ListInstalledRulesUseCase.
	 *
	 * @param basePath Optional path to rules directory (defaults to .agents/rules)
	 */
	static createListInstalledRulesUseCase(basePath?: string): ListInstalledRulesUseCase {
		const path = basePath || join(process.cwd(), '.agents', 'rules');
		const repository = new FsInstalledRuleRepository({ basePath: path });
		return new ListInstalledRulesUseCase(repository);
	}

	/**
	 * Creates a configured instance of VerifyRuleExistsUseCase.
	 *
	 * @param basePath Optional path to rules directory (defaults to .agents/rules)
	 */
	static createVerifyRuleExistsUseCase(basePath?: string): VerifyRuleExistsUseCase {
		const path = basePath || join(process.cwd(), '.agents', 'rules');
		const repository = new FsInstalledRuleRepository({ basePath: path });
		return new VerifyRuleExistsUseCase(repository);
	}

	/**
	 * Creates a configured instance of VerifyRulesExistenceUseCase.
	 *
	 * @param basePath Optional path to rules directory (defaults to .agents/rules)
	 */
	static createVerifyRulesExistenceUseCase(basePath?: string): VerifyRulesExistenceUseCase {
		const path = basePath || join(process.cwd(), '.agents', 'rules');
		const repository = new FsInstalledRuleRepository({ basePath: path });
		return new VerifyRulesExistenceUseCase(repository);
	}
}
