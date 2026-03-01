export enum MappingFormat {
	FILE = 'file',
	DIRECTORY = 'directory',
	JSON = 'json',
	MARKDOWN = 'markdown',
	JSON_TRANSFORM = 'json-transform',
	JSON_SPLIT = 'json-split',
}

export interface MappingRuleProps {
	from: string;
	to: string;
	format?: MappingFormat;
	/** Extension in source (e.g. .mdc). Must include leading dot. */
	sourceExt?: string;
	/** Extension in target (e.g. .md). Must include leading dot. */
	targetExt?: string;
	/** JSONPath for data extraction (if format involves JSON transformation) */
	extract?: string;
	/** Transformation adapter name (e.g. mcp-cursor, agent-mdc) */
	adapter?: string;
}

/**
 * Value object representing a transformation rule between an agent and the .ai standard.
 */
export class MappingRule {
	private fromPath: string;
	private toPath: string;
	private formatType: MappingFormat;
	private sourceExtValue?: string;
	private targetExtValue?: string;
	private extractValue?: string;
	private adapterValue?: string;

	constructor({
		from,
		to,
		format = MappingFormat.FILE,
		sourceExt,
		targetExt,
		extract,
		adapter,
	}: MappingRuleProps) {
		this.fromPath = from;
		this.toPath = to;
		this.formatType = format;
		this.sourceExtValue = sourceExt;
		this.targetExtValue = targetExt;
		this.extractValue = extract;
		this.adapterValue = adapter;
	}

	public static create(props: MappingRuleProps): MappingRule {
		// Basic validation: paths shouldn't be empty
		if (!props.from || !props.to) {
			throw new Error('Mapping source and target paths are required');
		}
		// Format conversion: if one is specified, both must be present
		const hasSource = props.sourceExt !== undefined && props.sourceExt !== '';
		const hasTarget = props.targetExt !== undefined && props.targetExt !== '';
		if (hasSource !== hasTarget) {
			throw new Error(
				'sourceExt and targetExt must both be specified or both omitted for format conversion',
			);
		}
		if (hasSource) {
			if (!props.sourceExt!.startsWith('.')) {
				throw new Error('sourceExt must start with a dot (e.g. .mdc)');
			}
			if (!props.targetExt!.startsWith('.')) {
				throw new Error('targetExt must start with a dot (e.g. .md)');
			}
		}
		return new MappingRule(props);
	}

	public get from(): string {
		return this.fromPath;
	}

	public get to(): string {
		return this.toPath;
	}

	public get format(): MappingFormat {
		return this.formatType;
	}

	public get sourceExt(): string | undefined {
		return this.sourceExtValue;
	}

	public get targetExt(): string | undefined {
		return this.targetExtValue;
	}

	public get extract(): string | undefined {
		return this.extractValue;
	}

	public get adapter(): string | undefined {
		return this.adapterValue;
	}

	/**
	 * Compares if two rules are identical.
	 */
	public equals(other: MappingRule): boolean {
		return (
			this.from === other.from &&
			this.to === other.to &&
			this.format === other.format &&
			this.sourceExt === other.sourceExt &&
			this.targetExt === other.targetExt &&
			this.extract === other.extract &&
			this.adapter === other.adapter
		);
	}
}
