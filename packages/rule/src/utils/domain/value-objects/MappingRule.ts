export interface MappingRuleProps {
	from: string;
	to: string;
	format?: string;
	/** Extension in source (e.g. .mdc). Must include leading dot. */
	sourceExt?: string;
	/** Extension in target (e.g. .md). Must include leading dot. */
	targetExt?: string;
}

export class MappingRule {
	public readonly from: string;
	public readonly to: string;
	public readonly format?: string;
	public readonly sourceExt?: string;
	public readonly targetExt?: string;

	constructor(
		fromOrProps: string | MappingRuleProps,
		toArg?: string,
		formatArg?: string,
		sourceExtArg?: string,
		targetExtArg?: string,
	) {
		let from: string;
		let to: string;
		let format: string | undefined;
		let sourceExt: string | undefined;
		let targetExt: string | undefined;

		if (typeof fromOrProps === 'object') {
			const p = fromOrProps;
			from = p.from;
			to = p.to;
			format = p.format;
			sourceExt = p.sourceExt;
			targetExt = p.targetExt;
		} else {
			from = fromOrProps;
			to = toArg ?? '';
			format = formatArg;
			sourceExt = sourceExtArg;
			targetExt = targetExtArg;
		}

		if (!from) throw new Error("MappingRule 'from' cannot be empty");
		if (!to) throw new Error("MappingRule 'to' cannot be empty");

		// Format conversion: if one is specified, both must be present
		const hasSource = sourceExt !== undefined && sourceExt !== '';
		const hasTarget = targetExt !== undefined && targetExt !== '';
		if (hasSource !== hasTarget) {
			throw new Error(
				'sourceExt and targetExt must both be specified or both omitted for format conversion',
			);
		}
		if (hasSource) {
			if (!sourceExt!.startsWith('.')) {
				throw new Error('sourceExt must start with a dot (e.g. .mdc)');
			}
			if (!targetExt!.startsWith('.')) {
				throw new Error('targetExt must start with a dot (e.g. .md)');
			}
		}

		// Security check: prevent absolute paths or parent directory traversal
		if (MappingRule.isUnsafePath(from) || MappingRule.isUnsafePath(to)) {
			throw new Error('MappingRule paths must be relative and safe');
		}

		this.from = from;
		this.to = to;
		this.format = format;
		this.sourceExt = sourceExt;
		this.targetExt = targetExt;
	}

	private static isUnsafePath(path: string): boolean {
		return path.startsWith('/') || path.includes('..');
	}
}
