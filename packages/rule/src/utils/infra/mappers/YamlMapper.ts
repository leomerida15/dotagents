import { AgentID } from '../../domain/value-objects/AgentId';
import { UIMetadata } from '../../domain/value-objects/UIMetadata';
import { MappingRule } from '../../domain/value-objects/MappingRule';
import { RuleSource } from '../../domain/value-objects/RuleSource';

interface YamlMappingItem {
	from: string;
	to: string;
	format?: string;
	source_ext?: string;
	target_ext?: string;
}

// Basic schema validation for YAML content
interface YamlRuleSchema {
	agent?: {
		id: string;
		name: string;
		source_root?: string;
		mapping?: {
			inbound?: YamlMappingItem[];
			outbound?: YamlMappingItem[];
		};
		ui?: {
			icon?: string;
			color?: string;
			description?: string;
		};
	};
	source_root?: string;
	mapping?: {
		inbound?: YamlMappingItem[];
		outbound?: YamlMappingItem[];
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

function toMappingRule(m: YamlMappingItem): MappingRule {
	return new MappingRule({
		from: m.from,
		to: m.to,
		format: m.format,
		...(m.source_ext != null && m.target_ext != null && {
			sourceExt: m.source_ext,
			targetExt: m.target_ext,
		}),
	});
}

export class YamlMapper {
	static toDomain(yamlContent: any, source: RuleSource): ParsedRuleData {
		// In a real scenario, use Zod or similar for validation
		const schema = yamlContent as YamlRuleSchema;

		const agent = schema.agent;
		if (!agent || !agent.id) {
			throw new Error('Invalid YAML: Missing agent.id');
		}

		const sourceRoot =
			agent.source_root ?? schema.source_root ?? '.';
		const mapping = agent.mapping ?? schema.mapping;
		const inbound = mapping?.inbound ?? [];
		const outbound = mapping?.outbound ?? [];

		return {
			id: new AgentID(agent.id),
			name: agent.name,
			sourceRoot,
			inbound: inbound.map(toMappingRule),
			outbound: outbound.map(toMappingRule),
			source: source,
			ui: new UIMetadata({
				icon: agent.ui?.icon,
				color: agent.ui?.color,
				description: agent.ui?.description,
			}),
		};
	}
}
