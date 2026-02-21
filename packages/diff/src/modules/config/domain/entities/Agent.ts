import { MappingRule } from '../value-objects/MappingRule';

/**
 * Represents an AI Agent/Tool configuration with its synchronization rules.
 */
export interface AgentProps {
	id: string;
	name: string;
	sourceRoot: string;
	inbound: MappingRule[];
	outbound: MappingRule[];
}

export class Agent {
	private idValue: string;
	private nameValue: string;
	private sourceRootPath: string;
	private inboundRulesList: MappingRule[];
	private outboundRulesList: MappingRule[];

	constructor({ id, name, sourceRoot, inbound, outbound }: AgentProps) {
		this.idValue = id;
		this.nameValue = name;
		this.sourceRootPath = sourceRoot;
		this.inboundRulesList = inbound;
		this.outboundRulesList = outbound;
	}

	/**
	 * Creates a new Agent entity.
	 */
	public static create(props: AgentProps): Agent {
		if (!props.id || !props.name) {
			throw new Error('Agent ID and Name are required');
		}
		return new Agent(props);
	}

	public get id(): string {
		return this.idValue;
	}

	public get name(): string {
		return this.nameValue;
	}

	public get sourceRoot(): string {
		return this.sourceRootPath;
	}

	public get inboundRules(): MappingRule[] {
		return [...this.inboundRulesList];
	}

	public get outboundRules(): MappingRule[] {
		return [...this.outboundRulesList];
	}

	/**
	 * Validates if the agent has a valid configuration.
	 */
	public validate(): boolean {
		return this.inboundRulesList.length > 0 && this.outboundRulesList.length > 0;
	}
}
