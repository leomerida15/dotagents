/**
 * GetEventsUseCase - Query event history with pagination and filtering.
 */

import type { IEventRepository } from '../../domain/ports/IEventRepository';
import type { GetEventsInput } from '../dto/schemas';
import type { FileEvent } from '../../domain/entities/FileEvent';
import { EventType } from '../../domain/value-objects/EventType';

/**
 * Event output DTO.
 */
export interface EventDTO {
	id: string;
	path: string;
	type: 'CREATED' | 'MODIFIED' | 'DELETED' | 'RENAMED';
	timestamp: string;
	oldHash: string | null;
	newHash: string | null;
	gitCommit: string | null;
	gitBranch: string | null;
	gitStatus: 'clean' | 'dirty' | null;
	size: number;
	isGitTracked: boolean;
}

/**
 * Paginated events result.
 */
export interface EventsResult {
	events: EventDTO[];
	total: number;
	limit: number;
	offset: number;
}

/**
 * Use case for querying file events.
 */
export class GetEventsUseCase {
	constructor(private readonly repository: IEventRepository) {}

	/**
	 * Execute the use case.
	 * @param input - Validated get events input
	 * @returns Paginated events result
	 */
	async execute(input: GetEventsInput): Promise<EventsResult> {
		// Convert string types to EventType enum
		const types = input.types.length > 0 ? input.types.map((t) => EventType[t]) : undefined;

		// Parse dates if provided
		const since = input.since ? new Date(input.since) : undefined;
		const until = input.until ? new Date(input.until) : undefined;

		// Query events
		const events = await this.repository.find({
			path: input.path,
			types,
			since,
			until,
			limit: input.limit,
			offset: input.offset,
		});

		// Get total count
		const total = await this.repository.count({
			path: input.path,
			types,
			since,
			until,
		});

		// Map to DTOs
		const eventDTOs = events.map((e) => this.mapToDTO(e));

		return {
			events: eventDTOs,
			total,
			limit: input.limit,
			offset: input.offset,
		};
	}

	private mapToDTO(event: FileEvent): EventDTO {
		return {
			id: event.id,
			path: event.path.value,
			type: event.type as 'CREATED' | 'MODIFIED' | 'DELETED' | 'RENAMED',
			timestamp: event.timestamp.toISOString(),
			oldHash: event.oldHash?.value ?? null,
			newHash: event.newHash?.value ?? null,
			gitCommit: event.gitInfo.commitHash,
			gitBranch: event.gitInfo.branch,
			gitStatus:
				event.gitInfo.isClean === null ? null : event.gitInfo.isClean ? 'clean' : 'dirty',
			size: event.size,
			isGitTracked: event.isGitTracked,
		};
	}
}
