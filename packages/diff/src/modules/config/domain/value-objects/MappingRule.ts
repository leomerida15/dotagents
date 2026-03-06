export enum MappingFormat {
	FILE = 'file',
	DIRECTORY = 'directory',
	JSON = 'json',
	MARKDOWN = 'markdown',
	JSON_TRANSFORM = 'json-transform',
	JSON_SPLIT = 'json-split',
	/** Collects multiple JSON files from a directory and merges them into a single target file. */
	JSON_MERGE = 'json-merge',
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

	/**
	 * Creates a new MappingRule instance with the provided properties.
	 * @param props - The properties for the mapping rule
	 */
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

	/**
	 * Factory method to create a new mapping rule.
	 * Validates paths and extensions, returning a new MappingRule instance.
	 *
	 * @param props The properties to create the mapping rule from
	 * @returns A new instance of MappingRule
	 * @throws Error if paths are missing or extensions are invalid
	 */
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

	/**
	 * Returns the source path of the mapping rule.
	 */
	public get from(): string {
		return this.fromPath;
	}

	/**
	 * Returns the target path of the mapping rule.
	 */
	public get to(): string {
		return this.toPath;
	}

	/**
	 * Returns the format type of the mapping rule.
	 */
	public get format(): MappingFormat {
		return this.formatType;
	}

	/**
	 * Returns the source file extension (e.g., .mdc).
	 */
	public get sourceExt(): string | undefined {
		return this.sourceExtValue;
	}

	/**
	 * Returns the target file extension (e.g., .md).
	 */
	public get targetExt(): string | undefined {
		return this.targetExtValue;
	}

	/**
	 * Returns the JSONPath for data extraction.
	 */
	public get extract(): string | undefined {
		return this.extractValue;
	}

	/**
	 * Returns the transformation adapter name.
	 */
	public get adapter(): string | undefined {
		return this.adapterValue;
	}

	/**
	 * Compares if two rules are identical.
	 *
	 * @param other The other MappingRule to compare against
	 * @returns True if both rules have identical properties, false otherwise
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
