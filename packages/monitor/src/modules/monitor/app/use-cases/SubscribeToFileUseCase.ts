/**
 * SubscribeToFileUseCase - Subscribe to individual file changes.
 */

import type { IFileWatcher } from '../../domain/ports/IFileWatcher';
import type { IEventRepository } from '../../domain/ports/IEventRepository';
import type { IGitService } from '../../domain/ports/IGitService';
import type { SubscribeToFileInput } from '../dto/schemas';
import type { Subscription } from '../../infra/utils/Observable';
import type { FileEvent } from '../../domain/entities/FileEvent';
import { FilePath } from '../../domain/value-objects/FilePath';
import { EventType } from '../../domain/value-objects/EventType';

/**
 * Subscription result.
 */
export interface SubscriptionResult {
	subscriptionId: string;
	unsubscribe: () => void;
}

/**
 * Use case for subscribing to individual file changes.
 */
export class SubscribeToFileUseCase {
	private subscriptions = new Map<string, Subscription>();
	private subscriptionIdCounter = 0;

	constructor(
		private readonly watcher: IFileWatcher,
		private readonly repository: IEventRepository,
		private readonly gitService: IGitService,
	) {}

	/**
	 * Execute the use case.
	 * @param input - Validated subscribe to file input
	 * @returns Subscription result with ID and unsubscribe function
	 */
	async execute(input: SubscribeToFileInput): Promise<SubscriptionResult> {
		const filePath = FilePath.create(input.path);

		// Check if already subscribed
		for (const [id, sub] of this.subscriptions) {
			if (!sub.closed) {
				// Return existing subscription
				return {
					subscriptionId: id,
					unsubscribe: () => this.unsubscribe(id),
				};
			}
		}

		// Create new subscription
		const subscriptionId = `sub-${++this.subscriptionIdCounter}`;

		// Start watching
		const observable = this.watcher.watch({
			path: filePath.value,
			recursive: false,
		});

		const subscription = observable.subscribe({
			next: async (event: FileEvent) => {
				// Persist event
				await this.repository.save(event);

				// If file was deleted, auto-cancel subscription
				if (event.type === EventType.DELETED) {
					this.unsubscribe(subscriptionId);
				}
			},
			error: (error: Error) => {
				console.error(`Subscription error for ${input.path}:`, error);
			},
		});

		this.subscriptions.set(subscriptionId, subscription);

		return {
			subscriptionId,
			unsubscribe: () => this.unsubscribe(subscriptionId),
		};
	}

	/**
	 * Unsubscribe from a file.
	 * @param subscriptionId - The subscription ID to cancel
	 */
	private unsubscribe(subscriptionId: string): void {
		const subscription = this.subscriptions.get(subscriptionId);
		if (subscription) {
			subscription.unsubscribe();
			this.subscriptions.delete(subscriptionId);
		}
	}
}
