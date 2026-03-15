/**
 * FsFileWatcher - File system watcher adapter.
 * Uses node:fs.watch() for file watching.
 */

import { watch as fsWatch, type FSWatcher } from 'node:fs';
import type { IFileWatcher, WatchOptions } from '../../domain/ports/IFileWatcher';
import { FileEvent } from '../../domain/entities/FileEvent';
import { FilePath } from '../../domain/value-objects/FilePath';
import { ContentHash } from '../../domain/value-objects/ContentHash';
import { GitInfo } from '../../domain/value-objects/GitInfo';
import { EventType } from '../../domain/value-objects/EventType';
import { Observable } from '../utils/Observable';
import { stat } from 'node:fs/promises';

interface WatcherEntry {
	path: string;
	watcher: FSWatcher;
	options: WatchOptions;
}

/**
 * File system watcher implementation using node:fs.watch().
 */
export class FsFileWatcher implements IFileWatcher {
	private watchers = new Map<string, WatcherEntry>();

	watch(options: WatchOptions): Observable<FileEvent> {
		const observable = new Observable<FileEvent>((observer) => {
			const filePath = FilePath.create(options.path);

			// Create watcher using node:fs.watch
			const watcher = fsWatch(
				filePath.value,
				{ recursive: options.recursive },
				(eventType: 'rename' | 'change', filename: string | null) => {
					this.handleWatchEvent(filePath.value, filename, eventType, options, observer);
				},
			);

			// Store watcher
			this.watchers.set(filePath.value, {
				path: filePath.value,
				watcher,
				options,
			});

			return () => {
				watcher.close();
				this.watchers.delete(filePath.value);
			};
		});

		return observable;
	}

	unwatch(path: string): void {
		const entry = this.watchers.get(path);
		if (entry) {
			entry.watcher.close();
			this.watchers.delete(path);
		}
	}

	unwatchAll(): void {
		for (const entry of this.watchers.values()) {
			entry.watcher.close();
		}
		this.watchers.clear();
	}

	private async handleWatchEvent(
		rootPath: string,
		filename: string | null,
		eventType: 'rename' | 'change',
		options: WatchOptions,
		observer: { next?: (value: FileEvent) => void; error?: (error: Error) => void },
	): Promise<void> {
		try {
			const fullPath = filename ? `${rootPath}/${filename}` : rootPath;
			const filePath = FilePath.create(fullPath);

			// Determine event type
			let eventTypeEnum: EventType;
			let oldHash: ContentHash | null = null;
			let newHash: ContentHash | null = null;
			let size = 0;

			if (eventType === 'rename') {
				// File was renamed or deleted
				try {
					await stat(fullPath);
					eventTypeEnum = EventType.CREATED;
					// Compute hash for new file
					const file = Bun.file(fullPath);
					const content = await file.arrayBuffer();
					newHash = await ContentHash.compute(Buffer.from(content));
					size = file.size;
				} catch {
					eventTypeEnum = EventType.DELETED;
				}
			} else {
				// File was modified
				eventTypeEnum = EventType.MODIFIED;
				// Compute new hash
				const file = Bun.file(fullPath);
				const content = await file.arrayBuffer();
				newHash = await ContentHash.compute(Buffer.from(content));
				size = file.size;
			}

			// Create event
			const event = FileEvent.create({
				path: filePath,
				type: eventTypeEnum,
				oldHash,
				newHash,
				gitInfo: GitInfo.none(), // Will be updated by use case with actual git info
				size,
				isGitTracked: false, // Will be updated by use case
			});

			observer.next?.(event);
		} catch (error) {
			observer.error?.(error as Error);
		}
	}
}
