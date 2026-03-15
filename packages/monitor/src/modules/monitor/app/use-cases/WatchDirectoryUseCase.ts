/**
 * WatchDirectoryUseCase - Watch directory recursively with filters.
 */

import type { IFileWatcher } from '../../domain/ports/IFileWatcher';
import type { IEventRepository } from '../../domain/ports/IEventRepository';
import type { IGitService } from '../../domain/ports/IGitService';
import type { WatchDirectoryInput } from '../dto/schemas';
import type { Subscription } from '../../infra/utils/Observable';
import type { FileEvent } from '../../domain/entities/FileEvent';

/**
 * Watch result.
 */
export interface WatchResult {
	watchId: string;
	unwatch: () => void;
}

/**
 * Use case for recursive directory watching.
 */
export class WatchDirectoryUseCase {
	private watches = new Map<string, Subscription>();
	private watchIdCounter = 0;

	constructor(
		private readonly watcher: IFileWatcher,
		private readonly repository: IEventRepository,
		private readonly gitService: IGitService,
	) {}

	/**
	 * Execute the use case.
	 * @param input - Validated watch directory input
	 * @returns Watch result with ID and unwatch function
	 */
	async execute(input: WatchDirectoryInput): Promise<WatchResult> {
		// Create watch ID
		const watchId = `watch-${++this.watchIdCounter}`;

		// Start watching
		const observable = this.watcher.watch({
			path: input.path,
			recursive: input.recursive,
			include: input.include,
			exclude: input.exclude,
			respectGitignore: input.respectGitignore,
			maxDepth: input.maxDepth,
			debounceMs: input.debounceMs,
		});

		// Apply debouncing
		const debouncedObservable = observable.debounceTime(input.debounceMs);

		const subscription = debouncedObservable.subscribe({
			next: async (event: FileEvent) => {
				// Only persist actual changes
				if (event.isActualChange) {
					await this.repository.save(event);
				}
			},
			error: (error: Error) => {
				console.error(`Watch error for ${input.path}:`, error);
			},
		});

		this.watches.set(watchId, subscription);

		return {
			watchId,
			unwatch: () => this.unwatch(watchId),
		};
	}

	/**
	 * Unwatch a directory.
	 * @param watchId - The watch ID to cancel
	 */
	private unwatch(watchId: string): void {
		const subscription = this.watches.get(watchId);
		if (subscription) {
			subscription.unsubscribe();
			this.watches.delete(watchId);
		}
	}
}
