import { AgentID } from '../../domain/value-objects/AgentId';
import { UIMetadata } from '../../domain/value-objects/UIMetadata';
import { MappingRule } from '../../domain/value-objects/MappingRule';
import { RuleSource } from '../../domain/value-objects/RuleSource';

export interface PathEntry {
	path: string;
	scope?: 'workspace' | 'home';
	type?: 'file' | 'directory';
	purpose?: 'marker' | 'sync_source' | 'config';
}

interface YamlMappingItem {
	from: string;
	to: string;
	format?: string;
	source_ext?: string;
	target_ext?: string;
	extract?: string;
	adapter?: string;
}

// Basic schema validation for YAML content
interface YamlRuleSchema {
	agent?: {
		id: string;
		name: string;
		source_root?: string;
		paths?: PathEntry[];
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
	paths?: PathEntry[];
	mapping?: {
		inbound?: YamlMappingItem[];
		outbound?: YamlMappingItem[];
	};
}

export interface ParsedRuleData {
	id: AgentID;
	name: string;
	sourceRoot: string;
	paths?: PathEntry[];
	inbound: MappingRule[];
	outbound: MappingRule[];
	source: RuleSource;
	ui: UIMetadata;
}

function deriveSourceRootFromPaths(paths: PathEntry[]): string | undefined {
	const workspacePaths = paths.filter((p) => p.scope === 'workspace');
	const markerOrSyncSource = workspacePaths.find(
		(p) => p.purpose === 'marker' || p.purpose === 'sync_source',
	);
	if (markerOrSyncSource) return markerOrSyncSource.path;
	const firstWorkspace = workspacePaths[0];
	return firstWorkspace?.path;
}

function toMappingRule(m: YamlMappingItem): MappingRule {
	return new MappingRule({
		from: m.from,
		to: m.to,
		format: m.format,
		sourceExt: m.source_ext,
		targetExt: m.target_ext,
		extract: m.extract,
		adapter: m.adapter,
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

		const paths = agent.paths ?? schema.paths;
		const fromPaths =
			paths != null && paths.length > 0 ? deriveSourceRootFromPaths(paths) : undefined;
		const sourceRoot = fromPaths ?? agent.source_root ?? schema.source_root ?? '.';
		const mapping = agent.mapping ?? schema.mapping;
		const inbound = mapping?.inbound ?? [];
		const outbound = mapping?.outbound ?? [];

		return {
			id: new AgentID(agent.id),
			name: agent.name,
			sourceRoot,
			paths: paths ?? undefined,
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
