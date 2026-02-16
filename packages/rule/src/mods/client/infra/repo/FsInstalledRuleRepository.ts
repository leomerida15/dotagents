
import * as yaml from 'js-yaml';
import type { IInstalledRuleRepository } from '../../app';
import { join } from 'node:path'
import { AgentID, InstalledRule } from '../../domain';
import { accessSync, readFileSync, readdirSync } from 'node:fs';
import { YamlMapper } from 'src/utils/infra';
import { RuleSourceType } from 'src/utils/domain';

export class FsInstalledRuleRepository implements IInstalledRuleRepository {
	constructor(private readonly basePath: string = join(process.cwd(), '.agents', '.ai', 'rules')) { }

	getRule(agentId: AgentID): InstalledRule | null {
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);

		try {
			accessSync(filePath);
			const content = readFileSync(filePath, 'utf8');
			const parsed = yaml.load(content);

			// YamlMapper returns ParsedRuleData, convert to InstalledRule
			const ruleData = YamlMapper.toDomain(parsed, {
				type: RuleSourceType.LOCAL,
				location: filePath,
			});

			return new InstalledRule({
				id: ruleData.id,
				name: ruleData.name,
				inbound: ruleData.inbound,
				outbound: ruleData.outbound,
			});
		} catch (error) {
			return null;
		}
	}

	getAllRules(): InstalledRule[] {
		try {
			const files = readdirSync(this.basePath);
			const yamlFiles = files.filter((f) => f.endsWith('.yaml'));

			const rules: InstalledRule[] = [];

			for (const file of yamlFiles) {
				const agentId = file.replace('.yaml', '');
				try {
					const rule = this.getRule(new AgentID(agentId));
					if (rule) {
						rules.push(rule);
					}
				} catch (error) {
					console.warn(`Skipping invalid agent ID in file: ${file}`, error);
				}
			}

			return rules;
		} catch (error) {
			// Directory doesn't exist or can't be read
			console.warn(`Could not read rules directory ${this.basePath}:`, error);
			return [];
		}
	}
}
