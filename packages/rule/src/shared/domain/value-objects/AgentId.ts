export class AgentID {
	private readonly value: string;

	constructor(value: string) {
		if (!value) {
			throw new Error('AgentID cannot be empty');
		}
		if (value.length > 50) {
			throw new Error('AgentID cannot be longer than 50 characters');
		}
		if (!/^[a-z0-9-]+$/.test(value)) {
			throw new Error('AgentID must be lowercase, alphanumeric, and kebab-case');
		}
		this.value = value;
	}

	toString(): string {
		return this.value;
	}

	equals(other: AgentID): boolean {
		return this.value === other.value;
	}
}
