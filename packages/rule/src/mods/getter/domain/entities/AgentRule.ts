import { AgentID } from '../../../../shared/domain/value-objects/AgentId';
import { MappingRule } from '../../../../shared/domain/value-objects/MappingRule';
import { RuleSource } from '../../../../shared/domain/value-objects/RuleSource';

interface AgentRuleProps {
	id: AgentID;
	name: string;
	sourceRoot: string;
	inbound: MappingRule[];
	outbound: MappingRule[];
	source: RuleSource;
}

export class AgentRule {
	public readonly id: AgentID;
	public readonly name: string;
	public readonly sourceRoot: string;
	public readonly inbound: MappingRule[];
	public readonly outbound: MappingRule[];
	public readonly source: RuleSource;

	constructor(props: AgentRuleProps) {
		if (!props.name) throw new Error('AgentRule name cannot be empty');

		this.id = props.id;
		this.name = props.name;
		this.sourceRoot = props.sourceRoot || '.';
		this.inbound = props.inbound;
		this.outbound = props.outbound;
		this.source = props.source;
	}

	get InboundMappings(): MappingRule[] {
		return [...this.inbound];
	}

	get OutboundMappings(): MappingRule[] {
		return [...this.outbound];
	}
}
