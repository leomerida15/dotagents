export class MappingRule {
	public readonly from: string;
	public readonly to: string;
	public readonly format?: string;

	constructor(from: string, to: string, format?: string) {
		if (!from) throw new Error("MappingRule 'from' cannot be empty");
		if (!to) throw new Error("MappingRule 'to' cannot be empty");

		// Security check: prevent absolute paths or parent directory traversal
		if (this.isUnsafePath(from) || this.isUnsafePath(to)) {
			throw new Error('MappingRule paths must be relative and safe');
		}

		this.from = from;
		this.to = to;
		this.format = format;
	}

	private isUnsafePath(path: string): boolean {
		return path.startsWith('/') || path.includes('..');
	}
}
