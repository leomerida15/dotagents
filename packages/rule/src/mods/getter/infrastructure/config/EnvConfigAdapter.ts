import { IGetterConfigService } from '../../application/ports/IGetterConfigService';
import { RuleSourceType } from '../../../../utils/domain/value-objects/RuleSource';

export class EnvConfigAdapter implements IGetterConfigService {
	getRuleSourceType(): RuleSourceType {
		const type = process.env.DOTAGENTS_RULE_SOURCE?.toUpperCase();
		if (type === 'GITHUB') return RuleSourceType.GITHUB;
		return RuleSourceType.LOCAL;
	}

	getGitHubRepoUrl(): string {
		return (
			process.env.DOTAGENTS_GITHUB_REPO ||
			'https://raw.githubusercontent.com/dotagents/rules/main'
		);
	}

	getLocalRulesPath(): string {
		return process.env.DOTAGENTS_LOCAL_PATH || './rules';
	}
}
