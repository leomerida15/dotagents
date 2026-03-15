/**
 * Port for event persistence operations.
 * Defines the interface for storing and retrieving file events.
 */

import type { FileEvent } from '../entities/FileEvent';
import type { EventType } from '../value-objects/EventType';

/**
 * Filters for querying events.
 */
export interface EventFilters {
	/** Filter by file path (exact match or prefix) */
	path?: string;
	/** Filter by event types */
	types?: EventType[];
	/** Filter events after this timestamp */
	since?: Date;
	/** Filter events before this timestamp */
	until?: Date;
	/** Maximum number of events to return */
	limit?: number;
	/** Number of events to skip (for pagination) */
	offset?: number;
}

/**
 * Port interface for event repository operations.
 */
export interface IEventRepository {
	/**
	 * Save a file event to the database.
	 * @param event - File event to save
	 * @returns Promise that resolves when saved
	 * @throws {DatabaseError} If persistence fails
	 */
	save(event: FileEvent): Promise<void>;

	/**
	 * Find events matching the given filters.
	 * @param filters - Query filters
	 * @returns Array of matching events
	 */
	find(filters: EventFilters): Promise<FileEvent[]>;

	/**
	 * Find events for a specific file path.
	 * @param path - File path to query
	 * @param limit - Maximum events to return
	 * @returns Array of events for the path
	 */
	findByPath(path: string, limit?: number): Promise<FileEvent[]>;

	/**
	 * Get the most recent event for a file path.
	 * @param path - File path to query
	 * @returns Most recent event or null if none exists
	 */
	getLatestEvent(path: string): Promise<FileEvent | null>;

	/**
	 * Get the total count of events matching filters.
	 * @param filters - Query filters (excluding limit/offset)
	 * @returns Total count
	 */
	count(filters?: Omit<EventFilters, 'limit' | 'offset'>): Promise<number>;
}
