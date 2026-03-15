import { describe, it, expect, beforeEach } from 'bun:test';
import { GetEventsUseCase } from '@monitor/app/use-cases/GetEventsUseCase';
import { FileEvent } from '@monitor/domain/entities/FileEvent';
import { FilePath } from '@monitor/domain/value-objects/FilePath';
import { ContentHash } from '@monitor/domain/value-objects/ContentHash';
import { GitInfo } from '@monitor/domain/value-objects/GitInfo';
import { EventType } from '@monitor/domain/value-objects/EventType';
import type { IEventRepository } from '@monitor/domain/ports/IEventRepository';
import type { EventFilters } from '@monitor/domain/ports/IEventRepository';
import type { GetEventsInput } from '@monitor/app/dto/schemas';

// Mock IEventRepository
class MockEventRepository implements IEventRepository {
	events: FileEvent[] = [];
	totalCount = 0;

	async save(): Promise<void> {
		// No-op for mock
	}

	async find(filters: EventFilters): Promise<FileEvent[]> {
		let result = [...this.events];

		if (filters.path) {
			result = result.filter((e) => e.path.value === filters.path);
		}

		if (filters.types && filters.types.length > 0) {
			result = result.filter((e) => filters.types!.includes(e.type));
		}

		if (filters.since) {
			result = result.filter((e) => e.timestamp.getTime() >= filters.since!.getTime());
		}

		if (filters.until) {
			result = result.filter((e) => e.timestamp.getTime() <= filters.until!.getTime());
		}

		// Apply pagination
		const offset = filters.offset ?? 0;
		const limit = filters.limit ?? 100;
		result = result.slice(offset, offset + limit);

		return result;
	}

	async findByPath(path: string): Promise<FileEvent[]> {
		return this.events.filter((e) => e.path.value === path);
	}

	async getLatestEvent(): Promise<FileEvent | null> {
		return this.events[this.events.length - 1] ?? null;
	}

	async count(): Promise<number> {
		return this.totalCount;
	}
}

const createTestEvent = (props: { path: string; type: EventType; timestamp: Date }): FileEvent => {
	return FileEvent.create({
		path: FilePath.create(props.path),
		type: props.type,
		oldHash: ContentHash.fromString('a1b2c3d4e5f67890'),
		newHash: ContentHash.fromString('0987f6e5d4c3b2a1'),
		gitInfo: GitInfo.create({
			commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
			branch: 'main',
			isClean: true,
		}),
		size: 1024,
		isGitTracked: true,
	});
};

describe('GetEventsUseCase', () => {
	let useCase: GetEventsUseCase;
	let mockRepository: MockEventRepository;

	beforeEach(() => {
		mockRepository = new MockEventRepository();
		useCase = new GetEventsUseCase(mockRepository);
	});

	describe('execute', () => {
		it('should return events with pagination info', async () => {
			mockRepository.events = [
				createTestEvent({
					path: '/home/user/file.ts',
					type: EventType.MODIFIED,
					timestamp: new Date('2024-01-15T10:30:00Z'),
				}),
			];
			mockRepository.totalCount = 1;

			const input: GetEventsInput = {
				limit: 10,
				offset: 0,
				types: [],
			};

			const result = await useCase.execute(input);

			expect(result.events).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.limit).toBe(10);
			expect(result.offset).toBe(0);
		});

		it('should filter by path', async () => {
			mockRepository.events = [
				createTestEvent({
					path: '/home/user/file1.ts',
					type: EventType.MODIFIED,
					timestamp: new Date(),
				}),
				createTestEvent({
					path: '/home/user/file2.ts',
					type: EventType.CREATED,
					timestamp: new Date(),
				}),
			];
			mockRepository.totalCount = 1;

			const result = await useCase.execute({
				path: '/home/user/file1.ts',
				limit: 10,
				offset: 0,
				types: [],
			} as GetEventsInput);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].path).toBe('/home/user/file1.ts');
		});

		it('should filter by event types', async () => {
			mockRepository.events = [
				createTestEvent({
					path: '/home/user/file1.ts',
					type: EventType.CREATED,
					timestamp: new Date(),
				}),
				createTestEvent({
					path: '/home/user/file2.ts',
					type: EventType.MODIFIED,
					timestamp: new Date(),
				}),
				createTestEvent({
					path: '/home/user/file3.ts',
					type: EventType.DELETED,
					timestamp: new Date(),
				}),
			];
			mockRepository.totalCount = 1;

			const result = await useCase.execute({
				limit: 10,
				offset: 0,
				types: ['CREATED'],
			} as GetEventsInput);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].type).toBe('CREATED');
		});

		it('should filter by time range', async () => {
			const event1 = FileEvent.reconstitute('event-1', new Date('2024-01-10T10:00:00Z'), {
				path: FilePath.create('/home/user/file1.ts'),
				type: EventType.MODIFIED,
				oldHash: ContentHash.fromString('a1b2c3d4e5f67890'),
				newHash: ContentHash.fromString('0987f6e5d4c3b2a1'),
				gitInfo: GitInfo.create({
					commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
					branch: 'main',
					isClean: true,
				}),
				size: 1024,
				isGitTracked: true,
			});
			const event2 = FileEvent.reconstitute('event-2', new Date('2024-01-20T10:00:00Z'), {
				path: FilePath.create('/home/user/file2.ts'),
				type: EventType.MODIFIED,
				oldHash: ContentHash.fromString('a1b2c3d4e5f67890'),
				newHash: ContentHash.fromString('0987f6e5d4c3b2a1'),
				gitInfo: GitInfo.create({
					commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
					branch: 'main',
					isClean: true,
				}),
				size: 1024,
				isGitTracked: true,
			});
			mockRepository.events = [event1, event2];
			mockRepository.totalCount = 1;

			const result = await useCase.execute({
				limit: 10,
				offset: 0,
				types: [],
				since: '2024-01-15T00:00:00Z',
				until: '2024-01-25T00:00:00Z',
			} as GetEventsInput);

			expect(result.events).toHaveLength(1);
			expect(result.events[0].path).toBe('/home/user/file2.ts');
		});

		it('should apply pagination', async () => {
			mockRepository.events = Array.from({ length: 5 }, (_, i) =>
				createTestEvent({
					path: `/home/user/file${i}.ts`,
					type: EventType.MODIFIED,
					timestamp: new Date(),
				}),
			);
			mockRepository.totalCount = 5;

			const result = await useCase.execute({
				limit: 2,
				offset: 1,
				types: [],
			} as GetEventsInput);

			expect(result.events).toHaveLength(2);
			expect(result.total).toBe(5);
		});

		it('should return empty array when no events match', async () => {
			mockRepository.events = [];
			mockRepository.totalCount = 0;

			const result = await useCase.execute({
				limit: 10,
				offset: 0,
				types: [],
			} as GetEventsInput);

			expect(result.events).toHaveLength(0);
			expect(result.total).toBe(0);
		});

		it('should map event to DTO correctly', async () => {
			const testEvent = FileEvent.reconstitute(
				'test-event-id',
				new Date('2024-01-15T10:30:00Z'),
				{
					path: FilePath.create('/home/user/file.ts'),
					type: EventType.MODIFIED,
					oldHash: ContentHash.fromString('a1b2c3d4e5f67890'),
					newHash: ContentHash.fromString('0987f6e5d4c3b2a1'),
					gitInfo: GitInfo.create({
						commitHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
						branch: 'main',
						isClean: true,
					}),
					size: 1024,
					isGitTracked: true,
				},
			);
			mockRepository.events = [testEvent];
			mockRepository.totalCount = 1;

			const result = await useCase.execute({
				limit: 10,
				offset: 0,
				types: [],
			} as GetEventsInput);

			const event = result.events[0];
			expect(event.id).toBe('test-event-id');
			expect(event.path).toBe('/home/user/file.ts');
			expect(event.type).toBe('MODIFIED');
			expect(event.timestamp).toBe('2024-01-15T10:30:00.000Z');
			expect(event.oldHash).toBe('a1b2c3d4e5f67890');
			expect(event.newHash).toBe('0987f6e5d4c3b2a1');
			expect(event.gitCommit).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
			expect(event.gitBranch).toBe('main');
			expect(event.gitStatus).toBe('clean');
			expect(event.size).toBe(1024);
			expect(event.isGitTracked).toBe(true);
		});

		it('should handle null git status correctly', async () => {
			mockRepository.events = [
				FileEvent.create({
					path: FilePath.create('/home/user/file.ts'),
					type: EventType.MODIFIED,
					oldHash: ContentHash.fromString('a1b2c3d4e5f67890'),
					newHash: ContentHash.fromString('0987f6e5d4c3b2a1'),
					gitInfo: GitInfo.none(),
					size: 1024,
					isGitTracked: false,
				}),
			];
			mockRepository.totalCount = 1;

			const result = await useCase.execute({
				limit: 10,
				offset: 0,
				types: [],
			} as GetEventsInput);

			expect(result.events[0].gitStatus).toBeNull();
			expect(result.events[0].gitCommit).toBeNull();
			expect(result.events[0].gitBranch).toBeNull();
		});
	});
});
