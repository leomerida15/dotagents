export interface MappingDTO {
	from: string;
	to: string;
	format?: string;
}

export interface AgentRuleDTO {
	id: string;
	name: string;
	sourceRoot: string;
	inbound: MappingDTO[];
	outbound: MappingDTO[];
	source: {
		type: string;
		location: string;
	};
}
