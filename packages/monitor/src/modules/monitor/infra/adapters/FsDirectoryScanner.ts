/**
 * FsDirectoryScanner - File system directory scanner adapter.
 * Implements IDirectoryScanner using Node.js fs APIs.
 */

import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { IDirectoryScanner, ScanOptions } from '../../domain/ports/IDirectoryScanner';
import { FileSnapshot } from '../../domain/entities/FileSnapshot';
import { FilePath } from '../../domain/value-objects/FilePath';
import { ContentHash } from '../../domain/value-objects/ContentHash';

/**
 * Parse .gitignore file and return patterns.
 */
async function parseGitignore(dirPath: string): Promise<string[]> {
	try {
		const content = await readFile(join(dirPath, '.gitignore'), 'utf-8');
		return content
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith('#'));
	} catch {
		return [];
	}
}

/**
 * Check if a path matches any glob pattern.
 */
function matchesAnyPattern(path: string, patterns: string[]): boolean {
	if (patterns.length === 0) return true;

	// Simple glob matching - convert glob to regex
	for (const pattern of patterns) {
		const regex = new RegExp(
			'^' +
				pattern
					.replace(/\*\*/g, '{{GLOBSTAR}}')
					.replace(/\*/g, '[^/]*')
					.replace(/\?/g, '.')
					.replace(/\{\{GLOBSTAR\}\}/g, '.*')
					.replace(/\./g, '\\.') +
				'$',
		);
		if (regex.test(path)) return true;
	}
	return false;
}

/**
 * File system directory scanner implementation.
 */
export class FsDirectoryScanner implements IDirectoryScanner {
	async scan(options: ScanOptions): Promise<FileSnapshot[]> {
		const results: FileSnapshot[] = [];
		const rootPath = FilePath.create(options.path);

		await this.scanRecursive(rootPath.value, rootPath.value, options, results, 0);

		return results;
	}

	private async scanRecursive(
		currentPath: string,
		rootPath: string,
		options: ScanOptions,
		results: FileSnapshot[],
		depth: number,
	): Promise<void> {
		// Check depth limit
		if (options.maxDepth !== undefined && depth > options.maxDepth) {
			return;
		}

		// Parse .gitignore if enabled
		let gitignorePatterns: string[] = [];
		if (options.respectGitignore) {
			gitignorePatterns = await parseGitignore(currentPath);
		}

		const entries = await readdir(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentPath, entry.name);
			const relativePath = relative(rootPath, fullPath);

			// Check exclude patterns first
			if (options.exclude && matchesAnyPattern(relativePath, options.exclude)) {
				continue;
			}

			// Check .gitignore patterns
			if (gitignorePatterns.length > 0 && matchesAnyPattern(entry.name, gitignorePatterns)) {
				continue;
			}

			// Check include patterns
			if (options.include && options.include.length > 0) {
				if (!matchesAnyPattern(relativePath, options.include)) {
					continue;
				}
			}

			const stats = await stat(fullPath);
			const filePath = FilePath.create(fullPath);

			if (entry.isSymbolicLink()) {
				// Handle symlinks
				results.push(
					FileSnapshot.create({
						path: filePath,
						size: 0,
						modifiedAt: stats.mtime,
						contentHash: ContentHash.fromString('symlink'),
						isDirectory: false,
						isSymlink: true,
						targetPath: options.followSymlinks
							? await this.readLinkTarget(fullPath)
							: undefined,
					}),
				);
			} else if (entry.isDirectory()) {
				results.push(
					FileSnapshot.create({
						path: filePath,
						size: 0,
						modifiedAt: stats.mtime,
						contentHash: ContentHash.fromString('directory'),
						isDirectory: true,
						isSymlink: false,
					}),
				);

				// Recurse if enabled
				if (options.recursive) {
					await this.scanRecursive(fullPath, rootPath, options, results, depth + 1);
				}
			} else if (entry.isFile()) {
				// Compute hash for files
				const file = Bun.file(fullPath);
				const content = await file.arrayBuffer();
				const hash = await ContentHash.compute(Buffer.from(content));

				results.push(
					FileSnapshot.create({
						path: filePath,
						size: stats.size,
						modifiedAt: stats.mtime,
						contentHash: hash,
						isDirectory: false,
						isSymlink: false,
					}),
				);
			}
		}
	}

	private async readLinkTarget(path: string): Promise<string | undefined> {
		try {
			const { readlink } = await import('node:fs/promises');
			return await readlink(path);
		} catch {
			return undefined;
		}
	}
}
