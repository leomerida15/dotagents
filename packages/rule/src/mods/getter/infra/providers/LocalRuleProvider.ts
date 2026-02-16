import type { IRuleProvider } from '../../app/ports/IRuleProvider';
import { AgentID } from '../../../../utils/domain/value-objects/AgentId';
import { AgentRule } from '../../domain/entities/AgentRule';
import { RuleSource } from '../../../../utils/domain/value-objects/RuleSource';
import { YamlMapper } from '../../../../utils/infra/mappers/YamlMapper';
import * as yaml from 'js-yaml';
import { join } from 'node:path';
import { readFile, access } from 'node:fs/promises';

export class LocalRuleProvider implements IRuleProvider {
	constructor(private readonly basePath: string) { }

	async getRule(agentId: AgentID): Promise<AgentRule | null> {
		// e.g. .agent-rules/cursor.yaml
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);

		try {
			await access(filePath);
			const content = await readFile(filePath, 'utf8');
			const parsed = yaml.load(content);

			const ruleData = YamlMapper.toDomain(parsed, RuleSource.Local(filePath));
			return new AgentRule(ruleData);
		} catch (error) {
			return null;
		}
	}
}
