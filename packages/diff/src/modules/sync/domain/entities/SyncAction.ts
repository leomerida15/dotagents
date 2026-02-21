import { ActionType } from '../value-objects/ActionType';

export interface SyncActionProps {
	type: ActionType;
	source?: string;
	target: string;
	content?: string | Record<string, any>;
	metadata?: Record<string, any>;
}

/**
 * Represents an atomic file system operation to be executed during synchronization.
 */
export class SyncAction {
	private typeValue: ActionType;
	private sourcePath?: string;
	private targetPath: string;
	private contentValue?: string | Record<string, any>;
	private metadataValue: Record<string, any>;

	constructor({ type, source, target, content, metadata = {} }: SyncActionProps) {
		this.typeValue = type;
		this.sourcePath = source;
		this.targetPath = target;
		this.contentValue = content;
		this.metadataValue = metadata;
	}

	public static create(props: SyncActionProps): SyncAction {
		if (!props.target) {
			throw new Error('Target path is required for SyncAction');
		}
		return new SyncAction(props);
	}

	public get type(): ActionType {
		return this.typeValue;
	}

	public get source(): string | undefined {
		return this.sourcePath;
	}

	public get target(): string {
		return this.targetPath;
	}

	public get content(): string | Record<string, any> | undefined {
		return this.contentValue;
	}

	public get metadata(): Record<string, any> {
		return { ...this.metadataValue };
	}

	/**
	 * Executes the action using the provided file system adapter.
	 */
	public async execute(fileSystem: any): Promise<void> {
		const { ActionType } = await import('../value-objects/ActionType');

		switch (this.type) {
			case ActionType.COPY:
				if (!this.sourcePath)
					throw new Error(`Source path missing for COPY to ${this.targetPath}`);
				await fileSystem.copy(this.sourcePath, this.targetPath);
				break;
			case ActionType.WRITE:
				const content =
					typeof this.contentValue === 'string'
						? this.contentValue
						: JSON.stringify(this.contentValue, null, 2);
				await fileSystem.writeFile(this.targetPath, content);
				break;
			case ActionType.DELETE:
				await fileSystem.delete(this.targetPath);
				break;
			case ActionType.MKDIR:
				await fileSystem.mkdir(this.targetPath);
				break;
			case ActionType.MOVE:
				if (!this.sourcePath)
					throw new Error(`Source path missing for MOVE to ${this.targetPath}`);
				await fileSystem.copy(this.sourcePath, this.targetPath);
				await fileSystem.delete(this.sourcePath);
				break;
			default:
				throw new Error(`Unsupported action type: ${this.type}`);
		}
	}
}
