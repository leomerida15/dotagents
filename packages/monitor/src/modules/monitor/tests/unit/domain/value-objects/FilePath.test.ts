import { describe, it, expect } from 'bun:test';
import { FilePath, InvalidPathError } from '@monitor/domain/value-objects/FilePath';

describe('FilePath', () => {
	describe('create', () => {
		it('should create FilePath from absolute path', () => {
			const path = FilePath.create('/home/user/project/file.ts');
			expect(path.value).toBe('/home/user/project/file.ts');
		});

		it('should normalize path separators', () => {
			const path = FilePath.create('/home/user//project/../file.ts');
			expect(path.value).toBe('/home/user/file.ts');
		});

		it('should throw InvalidPathError for relative path', () => {
			expect(() => FilePath.create('relative/path.ts')).toThrow(InvalidPathError);
			expect(() => FilePath.create('relative/path.ts')).toThrow('Path must be absolute');
		});

		it('should throw InvalidPathError for empty string', () => {
			expect(() => FilePath.create('')).toThrow(InvalidPathError);
		});

		it('should throw InvalidPathError for non-string values', () => {
			expect(() => FilePath.create(null as unknown as string)).toThrow(InvalidPathError);
			expect(() => FilePath.create(undefined as unknown as string)).toThrow(InvalidPathError);
		});
	});

	describe('basename', () => {
		it('should return filename for file path', () => {
			const path = FilePath.create('/home/user/file.ts');
			expect(path.basename).toBe('file.ts');
		});

		it('should return directory name for directory path', () => {
			const path = FilePath.create('/home/user/project/');
			expect(path.basename).toBe('project');
		});

		it('should handle root path', () => {
			const path = FilePath.create('/');
			expect(path.basename).toBe(''); // Node.js basename('/') returns ''
		});
	});

	describe('dirname', () => {
		it('should return parent directory', () => {
			const path = FilePath.create('/home/user/file.ts');
			expect(path.dirname).toBe('/home/user');
		});

		it('should handle nested directories', () => {
			const path = FilePath.create('/a/b/c/d/file.ts');
			expect(path.dirname).toBe('/a/b/c/d');
		});
	});

	describe('extension', () => {
		it('should return file extension', () => {
			const path = FilePath.create('/home/user/file.ts');
			expect(path.extension).toBe('.ts');
		});

		it('should return empty string for no extension', () => {
			const path = FilePath.create('/home/user/Makefile');
			expect(path.extension).toBe('');
		});

		it('should handle multiple dots', () => {
			const path = FilePath.create('/home/user/file.min.js');
			expect(path.extension).toBe('.js');
		});
	});

	describe('equals', () => {
		it('should return true for identical paths', () => {
			const a = FilePath.create('/home/user/file.ts');
			const b = FilePath.create('/home/user/file.ts');
			expect(a.equals(b)).toBe(true);
		});

		it('should return false for different paths', () => {
			const a = FilePath.create('/home/user/file.ts');
			const b = FilePath.create('/home/user/other.ts');
			expect(a.equals(b)).toBe(false);
		});

		it('should return true for equivalent paths after normalization', () => {
			const a = FilePath.create('/home/user//project/../file.ts');
			const b = FilePath.create('/home/user/file.ts');
			expect(a.equals(b)).toBe(true);
		});
	});

	describe('startsWith', () => {
		it('should return true for matching prefix', () => {
			const path = FilePath.create('/home/user/project/file.ts');
			expect(path.startsWith('/home/user')).toBe(true);
		});

		it('should return false for non-matching prefix', () => {
			const path = FilePath.create('/home/user/file.ts');
			expect(path.startsWith('/opt')).toBe(false);
		});
	});

	describe('toString', () => {
		it('should return normalized path', () => {
			const path = FilePath.create('/home/user/file.ts');
			expect(path.toString()).toBe('/home/user/file.ts');
		});
	});
});
