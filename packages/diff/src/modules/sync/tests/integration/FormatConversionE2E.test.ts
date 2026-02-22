import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'fs/promises';
import { SyncProjectUseCase, DefaultSyncInterpreter, MappingFormat } from '@dotagents/diff';
import { BunFileSystem } from '../../infra/adapters/BunFileSystem';

describe('FormatConversionE2E', () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'dotagents-format-e2e-'));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it('syncs single file .mdc to .md (inbound)', async () => {
		const sourceRoot = join(tempDir, 'agent');
		const targetRoot = join(tempDir, '.agents');
		await mkdir(sourceRoot, { recursive: true });
		await writeFile(join(sourceRoot, 'instructions.mdc'), 'Content\n');

		const syncProject = new SyncProjectUseCase({
			interpreter: new DefaultSyncInterpreter(),
			fileSystem: new BunFileSystem(),
		});

		await syncProject.execute({
			rules: [
				{
					from: 'instructions.mdc',
					to: 'rules/core.md',
					format: MappingFormat.MARKDOWN,
					sourceExt: '.mdc',
					targetExt: '.md',
				},
			],
			sourcePath: sourceRoot,
			targetPath: targetRoot,
		});

		const targetFile = join(targetRoot, 'rules', 'core.md');
		const content = await readFile(targetFile, 'utf-8');
		expect(content).toBe('Content\n');
	});

	it('outbound: syncs single file .md to .mdc', async () => {
		const sourceRoot = join(tempDir, '.agents');
		const targetRoot = join(tempDir, '.cursor');
		await mkdir(join(sourceRoot, 'rules'), { recursive: true });
		await writeFile(join(sourceRoot, 'rules', 'foo.md'), '# Bridge content\n');

		const syncProject = new SyncProjectUseCase({
			interpreter: new DefaultSyncInterpreter(),
			fileSystem: new BunFileSystem(),
		});

		await syncProject.execute({
			rules: [
				{
					from: 'rules/foo.md',
					to: 'rules/foo.mdc',
					format: MappingFormat.MARKDOWN,
					sourceExt: '.md',
					targetExt: '.mdc',
				},
			],
			sourcePath: sourceRoot,
			targetPath: targetRoot,
		});

		const targetFile = join(targetRoot, 'rules', 'foo.mdc');
		const content = await readFile(targetFile, 'utf-8');
		expect(content).toBe('# Bridge content\n');
	});
});
