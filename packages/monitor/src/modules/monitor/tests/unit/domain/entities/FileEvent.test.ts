import { describe, it, expect } from 'bun:test';
import { FileEvent } from '@monitor/domain/entities/FileEvent';
import { FilePath } from '@monitor/domain/value-objects/FilePath';
import { ContentHash } from '@monitor/domain/value-objects/ContentHash';
import { GitInfo } from '@monitor/domain/value-objects/GitInfo';
import { EventType } from '@monitor/domain/value-objects/EventType';

describe('FileEvent', () => {
	const createTestProps = () => ({
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
	});

	describe('create', () => {
		it('should create FileEvent with auto-generated id and timestamp', () => {
			const event = FileEvent.create(createTestProps());

			expect(event.id).toBeDefined();
			expect(event.id.length).toBeGreaterThan(0);
			expect(event.timestamp).toBeInstanceOf(Date);
		});

		it('should store all properties correctly', () => {
			const props = createTestProps();
			const event = FileEvent.create(props);

			expect(event.path.equals(props.path)).toBe(true);
			expect(event.type).toBe(props.type);
			expect(event.oldHash?.equals(props.oldHash!)).toBe(true);
			expect(event.newHash?.equals(props.newHash!)).toBe(true);
			expect(event.gitInfo.equals(props.gitInfo)).toBe(true);
			expect(event.size).toBe(props.size);
			expect(event.isGitTracked).toBe(props.isGitTracked);
		});

		it('should handle null oldHash for created files', () => {
			const event = FileEvent.create({
				...createTestProps(),
				type: EventType.CREATED,
				oldHash: null,
			});

			expect(event.oldHash).toBeNull();
			expect(event.newHash).not.toBeNull();
		});

		it('should handle null newHash for deleted files', () => {
			const event = FileEvent.create({
				...createTestProps(),
				type: EventType.DELETED,
				newHash: null,
			});

			expect(event.newHash).toBeNull();
			expect(event.oldHash).not.toBeNull();
		});

		it('should accept optional metadata', () => {
			const metadata = { customField: 'value', count: 42 };
			const event = FileEvent.create({
				...createTestProps(),
				metadata,
			});

			expect(event.metadata).toEqual(metadata);
		});
	});

	describe('reconstitute', () => {
		it('should recreate FileEvent from persisted data', () => {
			const id = 'test-uuid-123';
			const timestamp = new Date('2024-01-15T10:30:00Z');
			const props = createTestProps();

			const event = FileEvent.reconstitute(id, timestamp, props);

			expect(event.id).toBe(id);
			expect(event.timestamp).toEqual(timestamp);
			expect(event.path.equals(props.path)).toBe(true);
			expect(event.type).toBe(props.type);
		});
	});

	describe('isActualChange', () => {
		it('should return true when hashes differ (modified)', () => {
			const event = FileEvent.create(createTestProps());
			expect(event.isActualChange).toBe(true);
		});

		it('should return true when oldHash is null (created)', () => {
			const event = FileEvent.create({
				...createTestProps(),
				type: EventType.CREATED,
				oldHash: null,
			});
			expect(event.isActualChange).toBe(true);
		});

		it('should return true when newHash is null (deleted)', () => {
			const event = FileEvent.create({
				...createTestProps(),
				type: EventType.DELETED,
				newHash: null,
			});
			expect(event.isActualChange).toBe(true);
		});

		it('should return false when hashes are same (no actual change)', () => {
			const sameHash = ContentHash.fromString('a1b2c3d4e5f67890');
			const event = FileEvent.create({
				...createTestProps(),
				oldHash: sameHash,
				newHash: sameHash,
			});
			expect(event.isActualChange).toBe(false);
		});

		it('should return true for all event types except unchanged modified', () => {
			const created = FileEvent.create({
				...createTestProps(),
				type: EventType.CREATED,
				oldHash: null,
			});
			expect(created.isActualChange).toBe(true);

			const deleted = FileEvent.create({
				...createTestProps(),
				type: EventType.DELETED,
				newHash: null,
			});
			expect(deleted.isActualChange).toBe(true);

			const renamed = FileEvent.create({
				...createTestProps(),
				type: EventType.RENAMED,
			});
			expect(renamed.isActualChange).toBe(true);
		});
	});

	describe('unique ids', () => {
		it('should generate unique ids for each event', () => {
			const props = createTestProps();
			const event1 = FileEvent.create(props);
			const event2 = FileEvent.create(props);

			expect(event1.id).not.toBe(event2.id);
		});
	});

	describe('timestamps', () => {
		it('should generate timestamps at creation time', () => {
			const before = new Date();
			const event = FileEvent.create(createTestProps());
			const after = new Date();

			expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});
});
