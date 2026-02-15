/**
 * Base class for all application-specific exceptions.
 */
export class ApplicationException extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'ApplicationException';
	}
}

/**
 * Thrown when a project is not initialized (no .ai folder found).
 */
export class ProjectNotInitializedException extends ApplicationException {
	constructor(workspaceRoot: string) {
		super(
			`Project at ${workspaceRoot} is not initialized. Run initialization first.`,
			'PROJECT_NOT_INITIALIZED',
		);
	}
}

/**
 * Thrown when an agent is not found in the configuration.
 */
export class AgentNotFoundException extends ApplicationException {
	constructor(agentId: string) {
		super(`Agent with ID "${agentId}" not found in current configuration.`, 'AGENT_NOT_FOUND');
	}
}

/**
 * Thrown when rule fetching fails.
 */
export class RuleFetchException extends ApplicationException {
	constructor(details: string) {
		super(`Failed to fetch master rules: ${details}`, 'RULE_FETCH_FAILED');
	}
}
