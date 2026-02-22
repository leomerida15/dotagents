import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { ActionType } from '../../domain/value-objects/ActionType';
import { join, isAbsolute, relative, normalize, basename, dirname } from 'path';
import { MappingRule } from '@diff/modules/config/domain/value-objects/MappingRule';
import { stat, access, readdir } from 'node:fs/promises';

/**
 * Default implementation of the Sync Interpreter that handles basic file and directory mapping.
 * When a rule has sourceExt/targetExt, file extensions are converted during sync (e.g. .mdc -> .md).
 * Limitation: files not matching sourceExt are copied as-is; multiple files mapping to same target may overwrite.
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
		const { sourceRoot, targetRoot, manifest, force, enableDelete, affectedPaths } = options;

		if (affectedPaths && affectedPaths.length > 0) {
			return this.interpretIncremental(rule, sourceRoot, targetRoot, affectedPaths, enableDelete ?? false);
		}

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
			const isDirectory = sourceStats.isDirectory();
			const hasConversion = rule.sourceExt != null && rule.targetExt != null;

			if (isDirectory && hasConversion) {
				const files = await this.walkFiles(fullSource);
				for (const file of files) {
					const rel = relative(fullSource, file);
					const rawTarget = join(fullTarget, rel);
					const target = this.applyFormatConversion(file, rawTarget, rule);
					actions.push(SyncAction.create({ type: ActionType.COPY, source: file, target }));
				}
			} else {
				const target = this.applyFormatConversion(fullSource, fullTarget, rule);
				actions.push(
					SyncAction.create({
						type: ActionType.COPY,
						source: fullSource,
						target,
					}),
				);
			}
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

	private applyFormatConversion(sourcePath: string, targetPath: string, rule: MappingRule): string {
		const se = rule.sourceExt;
		const te = rule.targetExt;
		if (se == null || te == null) return targetPath;
		const base = basename(sourcePath);
		if (!base.endsWith(se)) return targetPath;
		const targetBase = base.slice(0, -se.length) + te;
		return join(dirname(targetPath), targetBase);
	}

	private async walkFiles(dirPath: string): Promise<string[]> {
		const files: string[] = [];
		const entries = await readdir(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);
			if (entry.isDirectory()) {
				files.push(...(await this.walkFiles(fullPath)));
			} else {
				files.push(fullPath);
			}
		}
		return files;
	}

	private async interpretIncremental(
		rule: MappingRule,
		sourceRoot: string,
		targetRoot: string,
		affectedPaths: string[],
		enableDelete: boolean,
	): Promise<SyncAction[]> {
		const baseSource = normalize(isAbsolute(rule.from) ? rule.from : join(sourceRoot, rule.from));
		const baseTarget = normalize(isAbsolute(rule.to) ? rule.to : join(targetRoot, rule.to));
		const actions: SyncAction[] = [];

		for (const ap of affectedPaths) {
			const absPath = normalize(ap);
			const relPart = relative(baseSource, absPath);
			if (relPart.startsWith('..') || isAbsolute(relPart)) continue;
			const rawTargetPath = join(baseTarget, relPart);
			const targetPath = this.applyFormatConversion(absPath, rawTargetPath, rule);

			const sourceExists = await this.exists(absPath);
			if (sourceExists) {
				actions.push(SyncAction.create({ type: ActionType.COPY, source: absPath, target: targetPath }));
			} else if (enableDelete) {
				const targetExists = await this.exists(targetPath);
				if (targetExists) {
					actions.push(SyncAction.create({ type: ActionType.DELETE, target: targetPath }));
				}
			}
		}
		return actions;
	}
}
