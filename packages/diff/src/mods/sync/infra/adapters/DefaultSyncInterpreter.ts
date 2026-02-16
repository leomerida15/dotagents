import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { ActionType } from '../../domain/value-objects/ActionType';
import { join, isAbsolute } from 'path';
import { MappingRule } from '@diff/mods/config/domain/value-objects/MappingRule';
import { stat, access } from 'node:fs/promises';

/**
 * Default implementation of the Sync Interpreter that handles basic file and directory mapping.
 */
export class DefaultSyncInterpreter implements ISyncInterpreter {
	/**
	 * Interprets a mapping rule into specific file system actions.
	 * @param rule The mapping rule to interpret.
	 * @param options Should contain 'sourceRoot' and 'targetRoot' paths, manifest, and flags.
	 */
	async interpret(
		rule: MappingRule,
		options: SyncOptions,
	): Promise<SyncAction[]> {
		const { sourceRoot, targetRoot, manifest, force, enableDelete } = options;

		if (!sourceRoot || !targetRoot) {
			throw new Error('SyncInterpreter requires sourceRoot and targetRoot in options');
		}

		const fullSource = isAbsolute(rule.from) ? rule.from : join(sourceRoot, rule.from);
		const fullTarget = isAbsolute(rule.to) ? rule.to : join(targetRoot, rule.to);

		const actions: SyncAction[] = [];

		let sourceStats;
		try {
			sourceStats = await stat(fullSource);
		} catch (error) {
			// Source doesn't exist.
			// If deletion is enabled and target exists, delete target to mirror source state.
			if (enableDelete) {
				const targetExists = await this.exists(fullTarget);
				if (targetExists) {
					actions.push(
						SyncAction.create({
							type: ActionType.DELETE,
							target: fullTarget,
						}),
					);
				}
			}
			return actions;
		}

		// Source exists. Check target state.
		const targetExists = await this.exists(fullTarget);

		let shouldCopy = false;

		if (!targetExists) {
			// Target doesn't exist -> Copy
			shouldCopy = true;
		} else if (force) {
			// Force update -> Copy
			shouldCopy = true;
		} else if (manifest) {
			// Compare timestamps
			// If source modified AFTER last sync -> Copy
			if (sourceStats.mtimeMs > manifest.lastProcessedAt) {
				shouldCopy = true;
			}
		} else {
			// No manifest and target exists.
			// To be safe and ensure consistency, we default to update if no state is known,
			// or we could check content. For now, we assume if rule is present, we want to sync.
			// But to be "optimizer", maybe we should check mtime of target?
			// Let's rely on source MTIME > target MTIME if no manifest?
			// For this sprint, if no manifest, we force copy to ensure state.
			shouldCopy = true;
		}

		if (shouldCopy) {
			// Determine action type based on rule format or source type
			// Note: MappingRule.format is a hint, but we can also check directory stats
			const isDirectory = sourceStats.isDirectory();

			// Recursively copy directories is handled by the FileSystem adapter usually for 'COPY'
			// But if format says FILE and it is a directory, strictly it's a mismatch.
			// keeping it simple:
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

	private async exists(path: string): Promise<boolean> {
		try {
			await access(path);
			return true;
		} catch {
			return false;
		}
	}
}
