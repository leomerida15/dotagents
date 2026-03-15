import { describe, it, expect } from 'bun:test';
import { FileSnapshot } from '@monitor/domain/entities/FileSnapshot';
import { FilePath } from '@monitor/domain/value-objects/FilePath';
import { ContentHash } from '@monitor/domain/value-objects/ContentHash';

describe('FileSnapshot', () => {
	const createTestProps = () => ({
		path: FilePath.create('/home/user/file.ts'),
		size: 1024,
		modifiedAt: new Date('2024-01-15T10:30:00Z'),
		contentHash: ContentHash.fromString('a1b2c3d4e5f67890'),
		isDirectory: false,
		isSymlink: false,
	});

	describe('create', () => {
		it('should create FileSnapshot with all properties', () => {
			const props = createTestProps();
			const snapshot = FileSnapshot.create(props);

			expect(snapshot.path.equals(props.path)).toBe(true);
			expect(snapshot.size).toBe(props.size);
			expect(snapshot.modifiedAt).toEqual(props.modifiedAt);
			expect(snapshot.contentHash.equals(props.contentHash)).toBe(true);
			expect(snapshot.isDirectory).toBe(props.isDirectory);
			expect(snapshot.isSymlink).toBe(props.isSymlink);
		});

		it('should create directory snapshot', () => {
			const snapshot = FileSnapshot.create({
				...createTestProps(),
				path: FilePath.create('/home/user/project'),
				isDirectory: true,
				size: 0,
			});

			expect(snapshot.isDirectory).toBe(true);
			expect(snapshot.isSymlink).toBe(false);
			expect(snapshot.size).toBe(0);
		});

		it('should create symlink snapshot', () => {
			const snapshot = FileSnapshot.create({
				...createTestProps(),
				isSymlink: true,
				targetPath: '/path/to/target',
			});

			expect(snapshot.isSymlink).toBe(true);
			expect(snapshot.targetPath).toBe('/path/to/target');
		});

		it('should handle symlink without target (broken link)', () => {
			const snapshot = FileSnapshot.create({
				...createTestProps(),
				isSymlink: true,
				targetPath: undefined,
			});

			expect(snapshot.isSymlink).toBe(true);
			expect(snapshot.targetPath).toBeUndefined();
		});
	});

	describe('toJSON', () => {
		it('should return plain object representation', () => {
			const props = createTestProps();
			const snapshot = FileSnapshot.create(props);
			const json = snapshot.toJSON();

			expect(json.path).toBe('/home/user/file.ts');
			expect(json.size).toBe(1024);
			expect(json.modifiedAt).toBe('2024-01-15T10:30:00.000Z');
			expect(json.contentHash).toBe('a1b2c3d4e5f67890');
			expect(json.isDirectory).toBe(false);
			expect(json.isSymlink).toBe(false);
			expect(json.targetPath).toBeUndefined();
		});

		it('should include targetPath for symlinks', () => {
			const snapshot = FileSnapshot.create({
				...createTestProps(),
				isSymlink: true,
				targetPath: '/path/to/target',
			});
			const json = snapshot.toJSON();

			expect(json.targetPath).toBe('/path/to/target');
		});

		it('should format modifiedAt as ISO string', () => {
			const snapshot = FileSnapshot.create({
				...createTestProps(),
				modifiedAt: new Date('2024-06-01T12:00:00.000Z'),
			});
			const json = snapshot.toJSON();

			expect(json.modifiedAt).toBe('2024-06-01T12:00:00.000Z');
		});
	});

	describe('getters', () => {
		it('should expose all properties via getters', () => {
			const props = createTestProps();
			const snapshot = FileSnapshot.create(props);

			expect(snapshot.path).toBe(props.path);
			expect(snapshot.size).toBe(props.size);
			expect(snapshot.modifiedAt).toBe(props.modifiedAt);
			expect(snapshot.contentHash).toBe(props.contentHash);
			expect(snapshot.isDirectory).toBe(props.isDirectory);
			expect(snapshot.isSymlink).toBe(props.isSymlink);
		});
	});
});
