import { AgentID } from '../../../../utils/domain/value-objects/AgentId';
import { MappingRule } from '../../../../utils/domain/value-objects/MappingRule';
import { RuleSource } from '../../../../utils/domain/value-objects/RuleSource';
import { UIMetadata } from '../../../../utils/domain/value-objects/UIMetadata';

interface AgentRuleProps {
	id: AgentID;
	name: string;
	sourceRoot: string;
	inbound: MappingRule[];
	outbound: MappingRule[];
	source: RuleSource;
	ui?: UIMetadata;
}

export class AgentRule {
	public readonly id: AgentID;
	public readonly name: string;
	public readonly sourceRoot: string;
	public readonly inbound: MappingRule[];
	public readonly outbound: MappingRule[];
	public readonly source: RuleSource;
	public readonly ui: UIMetadata;

	constructor(props: AgentRuleProps) {
		if (!props.name) throw new Error('AgentRule name cannot be empty');

		this.id = props.id;
		this.name = props.name;
		this.sourceRoot = props.sourceRoot || '.';
		this.inbound = props.inbound;
		this.outbound = props.outbound;
		this.source = props.source;
		this.ui = props.ui || UIMetadata.default();
	}

	get InboundMappings(): MappingRule[] {
		return [...this.inbound];
	}

	get OutboundMappings(): MappingRule[] {
		return [...this.outbound];
	}
}
