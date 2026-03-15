/**
 * PgliteEventRepository - PGlite-based event repository.
 * Implements IEventRepository using PGlite for embedded PostgreSQL.
 */

import { PGlite } from '@electric-sql/pglite';
import type { IEventRepository, EventFilters } from '../../domain/ports/IEventRepository';
import { FileEvent } from '../../domain/entities/FileEvent';
import { FilePath } from '../../domain/value-objects/FilePath';
import { ContentHash } from '../../domain/value-objects/ContentHash';
import { GitInfo } from '../../domain/value-objects/GitInfo';
import { EventType } from '../../domain/value-objects/EventType';

/**
 * PGlite-based event repository implementation.
 */
export class PgliteEventRepository implements IEventRepository {
	constructor(private readonly db: PGlite) {
		this.initializeSchema();
	}

	private async initializeSchema(): Promise<void> {
		await this.db.exec(`
			CREATE TABLE IF NOT EXISTS file_events (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				file_path TEXT NOT NULL,
				event_type VARCHAR(20) NOT NULL,
				content_hash VARCHAR(16) NOT NULL,
				old_hash VARCHAR(16),
				file_size BIGINT,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				git_commit_hash VARCHAR(40),
				git_branch TEXT,
				git_is_clean BOOLEAN,
				is_git_tracked BOOLEAN DEFAULT FALSE,
				metadata JSONB
			);

			CREATE INDEX IF NOT EXISTS idx_file_events_path ON file_events(file_path);
			CREATE INDEX IF NOT EXISTS idx_file_events_created_at ON file_events(created_at DESC);
			CREATE INDEX IF NOT EXISTS idx_file_events_type ON file_events(event_type);
			CREATE INDEX IF NOT EXISTS idx_file_events_git_commit ON file_events(git_commit_hash);
		`);
	}

	async save(event: FileEvent): Promise<void> {
		// Check for duplicate within 1 second
		const recentResult = await this.db.query<DatabaseEvent>(
			`
			SELECT id, created_at FROM file_events
			WHERE file_path = $1
			AND event_type = $2
			AND content_hash = $3
			AND created_at > NOW() - INTERVAL '1 second'
			ORDER BY created_at DESC
			LIMIT 1
		`,
			[event.path.value, event.type, event.newHash?.value],
		);

		if (recentResult.rows.length > 0) {
			console.warn(`Duplicate event detected for ${event.path.value}, skipping`);
			return;
		}

		// Insert event with retry logic
		let attempts = 0;
		const maxAttempts = 3;

		while (attempts < maxAttempts) {
			try {
				await this.db.query(
					`
					INSERT INTO file_events (
						id, file_path, event_type, content_hash, old_hash, file_size,
						created_at, git_commit_hash, git_branch, git_is_clean, is_git_tracked, metadata
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				`,
					[
						event.id,
						event.path.value,
						event.type,
						event.newHash?.value ?? '',
						event.oldHash?.value ?? null,
						event.size,
						event.timestamp,
						event.gitInfo.commitHash,
						event.gitInfo.branch,
						event.gitInfo.isClean,
						event.isGitTracked,
						JSON.stringify(event.metadata ?? {}),
					],
				);
				return;
			} catch (error) {
				attempts++;
				if (attempts >= maxAttempts) {
					throw new Error(`Failed to save event after ${maxAttempts} attempts: ${error}`);
				}
				// Exponential backoff
				await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
			}
		}
	}

	async find(filters: EventFilters): Promise<FileEvent[]> {
		const conditions: string[] = ['1=1'];
		const params: unknown[] = [];
		let paramIndex = 0;

		if (filters.path) {
			conditions.push(`file_path = $${++paramIndex}`);
			params.push(filters.path);
		}

		if (filters.types && filters.types.length > 0) {
			const typePlaceholders = filters.types.map(() => `$${++paramIndex}`).join(',');
			conditions.push(`event_type IN (${typePlaceholders})`);
			params.push(...filters.types);
		}

		if (filters.since) {
			conditions.push(`created_at >= $${++paramIndex}`);
			params.push(filters.since);
		}

		if (filters.until) {
			conditions.push(`created_at <= $${++paramIndex}`);
			params.push(filters.until);
		}

		const limit = filters.limit ?? 100;
		const offset = filters.offset ?? 0;

		const query = `
			SELECT * FROM file_events
			WHERE ${conditions.join(' AND ')}
			ORDER BY created_at DESC
			LIMIT $${++paramIndex} OFFSET $${++paramIndex}
		`;
		params.push(limit, offset);

		const result = await this.db.query<DatabaseEvent>(query, params);
		return result.rows.map((row) => this.mapToEvent(row));
	}

	async findByPath(path: string, limit?: number): Promise<FileEvent[]> {
		return this.find({
			path,
			limit: limit ?? 100,
			offset: 0,
		});
	}

	async getLatestEvent(path: string): Promise<FileEvent | null> {
		const result = await this.db.query<DatabaseEvent>(
			`
			SELECT * FROM file_events
			WHERE file_path = $1
			ORDER BY created_at DESC
			LIMIT 1
			`,
			[path],
		);

		if (result.rows.length === 0) {
			return null;
		}

		const row = result.rows[0];
		if (!row) {
			return null;
		}

		return this.mapToEvent(row);
	}

	async count(filters?: Omit<EventFilters, 'limit' | 'offset'>): Promise<number> {
		const conditions: string[] = ['1=1'];
		const params: unknown[] = [];
		let paramIndex = 0;

		if (filters?.path) {
			conditions.push(`file_path = $${++paramIndex}`);
			params.push(filters.path);
		}

		if (filters?.types && filters.types.length > 0) {
			const typePlaceholders = filters.types.map(() => `$${++paramIndex}`).join(',');
			conditions.push(`event_type IN (${typePlaceholders})`);
			params.push(...filters.types);
		}

		if (filters?.since) {
			conditions.push(`created_at >= $${++paramIndex}`);
			params.push(filters.since);
		}

		if (filters?.until) {
			conditions.push(`created_at <= $${++paramIndex}`);
			params.push(filters.until);
		}

		const query = `SELECT COUNT(*) as count FROM file_events WHERE ${conditions.join(' AND ')}`;
		const result = await this.db.query<{ count: string }>(query, params);
		return parseInt(result.rows[0]?.count ?? '0', 10);
	}

	private mapToEvent(row: DatabaseEvent): FileEvent {
		return FileEvent.reconstitute(row.id, new Date(row.created_at), {
			path: FilePath.create(row.file_path),
			type: row.event_type as EventType,
			oldHash: row.old_hash ? ContentHash.fromString(row.old_hash) : null,
			newHash: ContentHash.fromString(row.content_hash),
			gitInfo: GitInfo.create({
				commitHash: row.git_commit_hash,
				branch: row.git_branch,
				isClean: row.git_is_clean,
			}),
			size: Number(row.file_size),
			isGitTracked: row.is_git_tracked,
			metadata: row.metadata ?? {},
		});
	}
}

interface DatabaseEvent {
	id: string;
	file_path: string;
	event_type: string;
	content_hash: string;
	old_hash: string | null;
	file_size: number;
	created_at: Date;
	git_commit_hash: string | null;
	git_branch: string | null;
	git_is_clean: boolean | null;
	is_git_tracked: boolean;
	metadata: Record<string, unknown> | null;
}
