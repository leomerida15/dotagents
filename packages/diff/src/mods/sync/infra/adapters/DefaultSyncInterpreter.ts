import type { ISyncInterpreter } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { ActionType } from '../../domain/value-objects/ActionType';
import { join, isAbsolute } from 'path';
import { MappingFormat, MappingRule } from '@diff/mods/config/domain/value-objects/MappingRule';

/**
 * Default implementation of the Sync Interpreter that handles basic file and directory mapping.
 */
export class DefaultSyncInterpreter implements ISyncInterpreter {
	/**
	 * Interprets a mapping rule into specific file system actions.
	 * @param rule The mapping rule to interpret.
	 * @param options Should contain 'sourceRoot' and 'targetRoot' paths.
	 */
	async interpret(
		rule: MappingRule,
		options: { sourceRoot: string; targetRoot: string },
	): Promise<SyncAction[]> {
		const { sourceRoot, targetRoot } = options;

		if (!sourceRoot || !targetRoot) {
			throw new Error('SyncInterpreter requires sourceRoot and targetRoot in options');
		}

		const fullSource = isAbsolute(rule.from) ? rule.from : join(sourceRoot, rule.from);
		const fullTarget = isAbsolute(rule.to) ? rule.to : join(targetRoot, rule.to);

		const actions: SyncAction[] = [];

		switch (rule.format) {
			case MappingFormat.FILE:
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target: fullTarget,
					}),
				);
				break;
			case MappingFormat.DIRECTORY:
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target: fullTarget,
					}),
				);
				break;
			case MappingFormat.JSON:
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target: fullTarget,
					}),
				);
				break;
			case MappingFormat.MARKDOWN:
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target: fullTarget,
					}),
				);
				break;
			default:
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target: fullTarget,
					}),
				);
		}

		return actions;
	}
}
