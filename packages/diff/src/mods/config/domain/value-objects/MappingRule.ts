export enum MappingFormat {
    FILE = 'file',
    DIRECTORY = 'directory',
    JSON = 'json',
    MARKDOWN = 'markdown'
}

export interface MappingRuleProps {
    from: string;
    to: string;
    format?: MappingFormat;
}

/**
 * Value object representing a transformation rule between an agent and the .ai standard.
 */
export class MappingRule {
    private fromPath: string;
    private toPath: string;
    private formatType: MappingFormat;

    constructor({ from, to, format = MappingFormat.FILE }: MappingRuleProps) {
        this.fromPath = from;
        this.toPath = to;
        this.formatType = format;
    }

    public static create(props: MappingRuleProps): MappingRule {
        // Basic validation: paths shouldn't be empty
        if (!props.from || !props.to) {
            throw new Error('Mapping source and target paths are required');
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

    /**
     * Compares if two rules are identical.
     */
    public equals(other: MappingRule): boolean {
        return (
            this.from === other.from &&
            this.to === other.to &&
            this.format === other.format
        );
    }
}
