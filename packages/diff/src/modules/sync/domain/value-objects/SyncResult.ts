import { SyncAction } from '../entities/SyncAction';

export interface SyncResultProps {
	status: 'success' | 'failure' | 'partial';
	actionsPerformed: SyncAction[];
	errors?: Error[];
	startedAt: number;
	completedAt?: number;
}

/**
 * Value object representing the result of a synchronization process.
 */
export class SyncResult {
	private statusValue: 'success' | 'failure' | 'partial';
	private actions: SyncAction[];
	private errorList: Error[];
	private startTime: number;
	private endTime?: number;

	constructor({
		status,
		actionsPerformed,
		errors = [],
		startedAt,
		completedAt,
	}: SyncResultProps) {
		this.statusValue = status;
		this.actions = actionsPerformed;
		this.errorList = errors;
		this.startTime = startedAt;
		this.endTime = completedAt;
	}

	public static createSuccess(actions: SyncAction[], start: number): SyncResult {
		return new SyncResult({
			status: 'success',
			actionsPerformed: actions,
			startedAt: start,
			completedAt: Date.now(),
		});
	}

	public static createFailure(error: Error, start: number): SyncResult {
		return new SyncResult({
			status: 'failure',
			actionsPerformed: [],
			errors: [error],
			startedAt: start,
			completedAt: Date.now(),
		});
	}

	public get status(): 'success' | 'failure' | 'partial' {
		return this.statusValue;
	}

	public get actionsPerformed(): SyncAction[] {
		return [...this.actions];
	}

	public get errors(): Error[] {
		return [...this.errorList];
	}

	public get startedAt(): number {
		return this.startTime;
	}

	public get completedAt(): number | undefined {
		return this.endTime;
	}

	public get duration(): number {
		return (this.endTime || Date.now()) - this.startTime;
	}
}
