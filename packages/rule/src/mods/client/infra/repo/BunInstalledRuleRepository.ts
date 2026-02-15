import type { IInstalledRuleRepository } from '../../app/ports/IInstalledRuleRepository';
import { AgentID } from '../../../../shared/domain/value-objects/AgentId';
import { InstalledRule } from '../../domain/entities/InstalledRule';
import { YamlMapper } from '../../../../shared/infrastructure/mappers/YamlMapper';
import * as yaml from 'js-yaml';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class BunInstalledRuleRepository implements IInstalledRuleRepository {
	constructor(private readonly basePath: string = join(process.cwd(), '.agents', '.ai')) { }

	async getRule(agentId: AgentID): Promise<InstalledRule | null> {
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);
		const file = Bun.file(filePath);

		if (!(await file.exists())) {
			return null;
		}

		try {
			const content = await file.text();
			const parsed = yaml.load(content);

			// YamlMapper returns ParsedRuleData, convert to InstalledRule
			const ruleData = YamlMapper.toDomain(parsed, {
				type: 'LOCAL',
				location: filePath,
			} as any);

			return new InstalledRule({
				id: ruleData.id,
				name: ruleData.name,
				inbound: ruleData.inbound,
				outbound: ruleData.outbound,
			});
		} catch (error) {
			console.warn(`Failed to parse rule file ${filePath}:`, error);
			return null;
		}
	}

	async getAllRules(): Promise<InstalledRule[]> {
		try {
			const files = await readdir(this.basePath);
			const yamlFiles = files.filter((f) => f.endsWith('.yaml'));

			const rules: InstalledRule[] = [];

			for (const file of yamlFiles) {
				const agentId = file.replace('.yaml', '');
				try {
					const rule = await this.getRule(new AgentID(agentId));
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
