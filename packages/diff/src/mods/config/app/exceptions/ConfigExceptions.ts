
export class RuleFetchException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RuleFetchException';
	}
}

export class AgentDetectionException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AgentDetectionException';
	}
}

export class ManifestInitializationException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ManifestInitializationException';
	}
}
