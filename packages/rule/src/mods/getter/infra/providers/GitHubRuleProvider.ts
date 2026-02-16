import type { IRuleProvider } from '../../app/ports/IRuleProvider';
import { AgentID } from '../../../../utils/domain/value-objects/AgentId';
import { AgentRule } from '../../domain/entities/AgentRule';
import { RuleSource } from '../../../../utils/domain/value-objects/RuleSource';
import { YamlMapper } from '../../../../utils/infra/mappers/YamlMapper';
import * as yaml from 'js-yaml';

export class GitHubRuleProvider implements IRuleProvider {
	constructor(private readonly repoBaseUrl: string) { }

	async getRule(agentId: AgentID): Promise<AgentRule | null> {
		// Construct raw URL: https://raw.githubusercontent.com/user/repo/main/rules/{agentId}.yaml
		// Assuming repoBaseUrl includes branch, e.g., https://raw.githubusercontent.com/dotagents/rules/main
		const url = `${this.repoBaseUrl}/${agentId.toString()}.yaml`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`GitHub fetch failed: ${response.statusText}`);
			}

			const content = await response.text();
			const parsed = yaml.load(content);

			const ruleData = YamlMapper.toDomain(parsed, RuleSource.GitHub(url));
			return new AgentRule(ruleData);
		} catch (error) {
			console.error(`Failed to fetch rule for ${agentId} from GitHub`, error);
			return null;
		}
	}
}
