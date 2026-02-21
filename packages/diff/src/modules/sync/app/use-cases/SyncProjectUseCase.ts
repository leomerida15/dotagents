import type { ISyncInterpreter } from '../../domain/ports/ISyncInterpreter';
import type { ISyncProject } from '../ports/ISyncProject';
import type { IFileSystem } from '../../domain/ports/IFileSystem';
import { SyncAction } from '../../domain/entities/SyncAction';
import { SyncResult } from '../../domain/value-objects/SyncResult';
import { MappingRule } from '../../../config/domain/value-objects/MappingRule';
import type { SyncProjectRequestDTO } from '../dtos/SyncProjectRequestDTO';
import type { SyncResultDTO } from '../dtos/SyncResultDTO';
import { SyncMapper } from '../mappers/SyncMapper';

export interface SyncProjectProps {
	interpreter: ISyncInterpreter;
	fileSystem: IFileSystem;
}

/**
 * Use case to synchronize a project based on mapping rules.
 */
export class SyncProjectUseCase implements ISyncProject {
	private interpreter: ISyncInterpreter;
	private fileSystem: IFileSystem;

	constructor({ interpreter, fileSystem }: SyncProjectProps) {
		this.interpreter = interpreter;
		this.fileSystem = fileSystem;
	}

	/**
	 * Executes the synchronization process.
	 * @param request The rules and paths for synchronization via DTO.
	 */
	async execute({
		rules,
		sourcePath,
		targetPath,
		affectedPaths,
	}: SyncProjectRequestDTO): Promise<SyncResultDTO> {
		const startedAt = Date.now();
		const allActions: SyncAction[] = [];

		try {
			for (const ruleDto of rules) {
				// Convert DTO to Domain Entity
				const rule = MappingRule.create(ruleDto);

				const actions = await this.interpreter.interpret(rule, {
					sourceRoot: sourcePath,
					targetRoot: targetPath,
					affectedPaths,
				});

				for (const action of actions) {
					await action.execute(this.fileSystem);
					allActions.push(action);
				}
			}

			const result = SyncResult.createSuccess(allActions, startedAt);
			return SyncMapper.toResultDTO(result);
		} catch (error) {
			const result = SyncResult.createFailure(error as Error, startedAt);
			return SyncMapper.toResultDTO(result);
		}
	}
}
