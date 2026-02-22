export interface MappingRuleItemDTO {
	from: string;
	to: string;
	format?: string;
	sourceExt?: string;
	targetExt?: string;
}

export interface InstalledRuleDTO {
	id: string;
	name: string;
	sourceRoot: string;
	mappings: {
		inbound: MappingRuleItemDTO[];
		outbound: MappingRuleItemDTO[];
	};
	ui?: {
		icon: string;
		color: string;
		description: string;
	};
	installedAt?: string; // ISO Date string
}
