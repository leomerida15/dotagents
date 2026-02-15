export enum RuleSourceType {
	LOCAL = 'LOCAL',
	GITHUB = 'GITHUB',
	MEMORY = 'MEMORY',
}

interface RuleSourceProps {
	type: RuleSourceType;
	location: string;
}

export class RuleSource {
	public readonly type: RuleSourceType;
	public readonly location: string;

	constructor(props: RuleSourceProps) {
		if (!props.location) {
			throw new Error('RuleSource location cannot be empty');
		}
		this.type = props.type;
		this.location = props.location;
	}

	static Local(path: string): RuleSource {
		return new RuleSource({ type: RuleSourceType.LOCAL, location: path });
	}

	static GitHub(repoUrl: string): RuleSource {
		return new RuleSource({ type: RuleSourceType.GITHUB, location: repoUrl });
	}
}
