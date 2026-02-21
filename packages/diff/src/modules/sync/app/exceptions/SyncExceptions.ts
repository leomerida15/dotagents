/**
 * Base class for all sync-specific application exceptions.
 */
export class SyncApplicationException extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'SyncApplicationException';
	}
}

/**
 * Thrown when a synchronization rule fails to be interpreted.
 */
export class RuleInterpretationException extends SyncApplicationException {
	constructor(ruleId: string, details: string) {
		super(`Failed to interpret rule "${ruleId}": ${details}`, 'RULE_INTERPRETATION_FAILED');
	}
}

/**
 * Thrown when a file operation fails during synchronization.
 */
export class SyncFileSystemException extends SyncApplicationException {
	constructor(operation: string, path: string, details: string) {
		super(`Failed to ${operation} at "${path}": ${details}`, 'SYNC_FILE_SYSTEM_ERROR');
	}
}
