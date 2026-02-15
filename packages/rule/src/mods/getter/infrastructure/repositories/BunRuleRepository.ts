import { IRuleRepository } from '../../application/ports/IRuleRepository';
import { AgentRule } from '../../domain/entities/AgentRule';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import * as yaml from 'js-yaml';

export class BunRuleRepository implements IRuleRepository {
	constructor(private readonly storagePath: string) {}

	async save(rule: AgentRule): Promise<void> {
		const filePath = join(this.storagePath, `${rule.id.toString()}.yaml`);

		await mkdir(dirname(filePath), { recursive: true });

		// Convert domain entity back to YAML format for storage
		// In a real app, use a Mapper explicitly. Here we simplify.
		const yamlContent = yaml.dump({
			agent: {
				id: rule.id.toString(),
				name: rule.name,
				source_root: rule.sourceRoot,
				mapping: {
					inbound: rule.InboundMappings,
					outbound: rule.OutboundMappings,
				},
			},
		});

		await Bun.write(filePath, yamlContent);
	}
}
