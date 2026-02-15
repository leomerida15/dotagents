import { AgentID } from '../../domain/value-objects/AgentId';
import { UIMetadata } from '../../domain/value-objects/UIMetadata';
import { MappingRule } from '../../domain/value-objects/MappingRule';
import { RuleSource } from '../../domain/value-objects/RuleSource';

// Basic schema validation for YAML content
interface YamlRuleSchema {
	agent: {
		id: string;
		name: string;
		source_root: string;
		mapping: {
			inbound: Array<{ from: string; to: string; format?: string }>;
			outbound: Array<{ from: string; to: string }>;
		};
		ui?: {
			icon?: string;
			color?: string;
			description?: string;
		};
	};
}

export interface ParsedRuleData {
	id: AgentID;
	name: string;
	sourceRoot: string;
	inbound: MappingRule[];
	outbound: MappingRule[];
	source: RuleSource;
	ui: UIMetadata;
}

export class YamlMapper {
	static toDomain(yamlContent: any, source: RuleSource): ParsedRuleData {
		// In a real scenario, use Zod or similar for validation
		const schema = yamlContent as YamlRuleSchema;

		if (!schema.agent || !schema.agent.id) {
			throw new Error('Invalid YAML: Missing agent.id');
		}

		return {
			id: new AgentID(schema.agent.id),
			name: schema.agent.name,
			sourceRoot: schema.agent.source_root,
			inbound: (schema.agent.mapping?.inbound || []).map(
				(m) => new MappingRule(m.from, m.to, m.format),
			),
			outbound: (schema.agent.mapping?.outbound || []).map(
				(m) => new MappingRule(m.from, m.to),
			),
			source: source,
			ui: new UIMetadata({
				icon: schema.agent.ui?.icon,
				color: schema.agent.ui?.color,
				description: schema.agent.ui?.description,
			}),
		};
	}
}
