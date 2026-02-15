import { AgentID } from '@rule/mods/client';
import { MappingRule } from '../../../../utils/domain/value-objects/MappingRule';

interface InstalledRuleProps {
	id: AgentID;
	name: string;
	inbound: MappingRule[];
	outbound: MappingRule[];
	installedAt?: Date;
}

export class InstalledRule {
	public readonly id: AgentID;
	public readonly name: string;
	public readonly inbound: MappingRule[];
	public readonly outbound: MappingRule[];
	public readonly installedAt: Date;

	constructor(props: InstalledRuleProps) {
		if (!props.name) throw new Error('InstalledRule name cannot be empty');

		this.id = props.id;
		this.name = props.name;
		this.inbound = props.inbound;
		this.outbound = props.outbound;
		this.installedAt = props.installedAt || new Date();
	}
}
