import { RuleSourceType } from '../../../../shared/domain/value-objects/RuleSource';

export interface IGetterConfigService {
	getRuleSourceType(): RuleSourceType;
	getGitHubRepoUrl(): string;
	getLocalRulesPath(): string;
}
