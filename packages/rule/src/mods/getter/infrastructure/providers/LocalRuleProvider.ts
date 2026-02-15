import type { IRuleProvider } from '../../application/ports/IRuleProvider';
import { AgentID } from '../../../../shared/domain/value-objects/AgentId';
import { AgentRule } from '../../domain/entities/AgentRule';
import { RuleSource } from '../../../../shared/domain/value-objects/RuleSource';
import { YamlMapper } from '../../../../shared/infrastructure/mappers/YamlMapper';
import * as yaml from 'js-yaml';
import { join } from 'path';

export class LocalRuleProvider implements IRuleProvider {
	constructor(private readonly basePath: string) {}

	async getRule(agentId: AgentID): Promise<AgentRule | null> {
		// e.g. .agent-rules/cursor.yaml
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);
		const file = Bun.file(filePath);

		if (!(await file.exists())) {
			return null;
		}

		const content = await file.text();
		const parsed = yaml.load(content);

		const ruleData = YamlMapper.toDomain(parsed, RuleSource.Local(filePath));
		return new AgentRule(ruleData);
	}
}
