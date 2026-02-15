import { IFileSystem } from '@diff/mods/sync/domain/ports/IFileSystem';
import * as fs from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Node.js implementation of IFileSystem using fs/promises.
 * Suitable for running within the VSCode extension host.
 */
export class NodeFileSystem implements IFileSystem {
    async readFile(path: string): Promise<string> {
        return fs.readFile(path, 'utf-8');
    }

    async writeFile(path: string, content: string): Promise<void> {
        const dir = dirname(path);
        await this.mkdir(dir);
        return fs.writeFile(path, content, 'utf-8');
    }

    async delete(path: string): Promise<void> {
        return fs.rm(path, { recursive: true, force: true });
    }

    async exists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    async copy(source: string, target: string): Promise<void> {
        const targetDir = dirname(target);
        await this.mkdir(targetDir);
        return fs.cp(source, target, { recursive: true });
    }

    async mkdir(path: string): Promise<void> {
        await fs.mkdir(path, { recursive: true });
    }

    async readDir(path: string): Promise<string[]> {
        return fs.readdir(path);
    }
}
