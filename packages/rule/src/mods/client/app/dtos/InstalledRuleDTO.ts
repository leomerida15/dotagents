export interface InstalledRuleDTO {
	id: string;
	name: string;
	mappings: {
		inbound: { from: string; to: string; format?: string }[];
		outbound: { from: string; to: string; format?: string }[];
	};
	installedAt?: string; // ISO Date string
}
