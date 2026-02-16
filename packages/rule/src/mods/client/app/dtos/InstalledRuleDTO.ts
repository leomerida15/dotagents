export interface InstalledRuleDTO {
	id: string;
	name: string;
	sourceRoot: string;
	mappings: {
		inbound: { from: string; to: string; format?: string }[];
		outbound: { from: string; to: string; format?: string }[];
	};
	ui?: {
		icon: string;
		color: string;
		description: string;
	};
	installedAt?: string; // ISO Date string
}
