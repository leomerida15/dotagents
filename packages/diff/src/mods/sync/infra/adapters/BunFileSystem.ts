import type { IFileSystem } from '@diff/mods/sync/domain/ports/IFileSystem';
import { unlink, mkdir, readdir, copyFile, stat, writeFile, readFile } from 'fs/promises';
import { dirname, join } from 'node:path';

/**
 * File system adapter using Bun and Node's fs/promises.
 */
export class BunFileSystem implements IFileSystem {
	async readFile(path: string): Promise<string> {
		return await readFile(path, 'utf8');
	}

	async writeFile(path: string, content: string): Promise<void> {
		const dir = dirname(path);
		if (!(await this.exists(dir))) {
			await this.mkdir(dir);
		}
		await writeFile(path, content);
	}

	async delete(path: string): Promise<void> {
		try {
			await unlink(path);
		} catch (error: any) {
			if (error.code === 'EISDIR') {
				const { rm } = await import('fs/promises');
				await rm(path, { recursive: true, force: true });
			} else if (error.code !== 'ENOENT') {
				throw error;
			}
		}
	}

	async exists(path: string): Promise<boolean> {
		try {
			await stat(path);
			return true;
		} catch {
			return false;
		}
	}

	async copy(source: string, target: string): Promise<void> {
		const targetDir = dirname(target);
		if (!(await this.exists(targetDir))) {
			await this.mkdir(targetDir);
		}

		const sourceStat = await stat(source);
		if (sourceStat.isDirectory()) {
			await this.copyDir(source, target);
		} else {
			await copyFile(source, target);
		}
	}

	async mkdir(path: string): Promise<void> {
		await mkdir(path, { recursive: true });
	}

	async readDir(path: string): Promise<string[]> {
		return await readdir(path);
	}

	private async copyDir(source: string, target: string): Promise<void> {
		await this.mkdir(target);
		const files = await this.readDir(source);
		for (const file of files) {
			const curSource = join(source, file);
			const curTarget = join(target, file);
			const curStat = await stat(curSource);
			if (curStat.isDirectory()) {
				await this.copyDir(curSource, curTarget);
			} else {
				await copyFile(curSource, curTarget);
			}
		}
	}
}
