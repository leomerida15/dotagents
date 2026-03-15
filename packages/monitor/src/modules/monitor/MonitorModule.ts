/**
 * MonitorModule - Factory for creating configured monitor components.
 * Wires all dependencies following the dependency injection pattern.
 */

import { PGlite } from '@electric-sql/pglite';
import type { McpServerAdapter } from './infra/adapters/McpServerAdapter';
import { FsFileWatcher } from './infra/adapters/FsFileWatcher';
import { FsDirectoryScanner } from './infra/adapters/FsDirectoryScanner';
import { GitCliService } from './infra/adapters/GitCliService';
import { PgliteEventRepository } from './infra/repositories/PgliteEventRepository';
import { ListFilesUseCase } from './app/use-cases/ListFilesUseCase';
import { GetFileInfoUseCase } from './app/use-cases/GetFileInfoUseCase';
import { SubscribeToFileUseCase } from './app/use-cases/SubscribeToFileUseCase';
import { WatchDirectoryUseCase } from './app/use-cases/WatchDirectoryUseCase';
import { GetEventsUseCase } from './app/use-cases/GetEventsUseCase';

/**
 * Configuration options for the Monitor module.
 */
export interface MonitorOptions {
	/** Path to the project root (for Git operations) */
	projectRoot: string;
	/** Path to the PGlite database file */
	databasePath?: string;
}

/**
 * Module factory for creating monitor components.
 */
export class MonitorModule {
	/**
	 * Create a configured MCP server with all dependencies wired.
	 * @param options - Monitor configuration options
	 * @returns Configured McpServerAdapter instance
	 */
	static async createMcpServer(options: MonitorOptions): Promise<McpServerAdapter> {
		// Initialize database
		const db = new PGlite(options.databasePath ?? 'monitor.db');

		// Create infrastructure adapters
		const watcher = new FsFileWatcher();
		const scanner = new FsDirectoryScanner();
		const repository = new PgliteEventRepository(db);
		const gitService = new GitCliService(options.projectRoot);

		// Create use cases with injected dependencies
		const listFilesUseCase = new ListFilesUseCase(scanner);
		const getFileInfoUseCase = new GetFileInfoUseCase(scanner);
		const subscribeToFileUseCase = new SubscribeToFileUseCase(watcher, repository, gitService);
		const watchDirectoryUseCase = new WatchDirectoryUseCase(watcher, repository, gitService);
		const getEventsUseCase = new GetEventsUseCase(repository);

		// Dynamically import McpServerAdapter to avoid circular dependencies
		const { McpServerAdapter } = await import('./infra/adapters/McpServerAdapter');

		// Create and return the MCP server adapter
		return new McpServerAdapter({
			listFilesUseCase,
			getFileInfoUseCase,
			subscribeToFileUseCase,
			watchDirectoryUseCase,
			getEventsUseCase,
		});
	}

	/**
	 * Create individual use cases for custom wiring.
	 * @param options - Monitor configuration options
	 * @returns Object containing all use cases
	 */
	static async createUseCases(options: MonitorOptions) {
		const db = new PGlite(options.databasePath ?? 'monitor.db');
		const watcher = new FsFileWatcher();
		const scanner = new FsDirectoryScanner();
		const repository = new PgliteEventRepository(db);
		const gitService = new GitCliService(options.projectRoot);

		return {
			listFiles: new ListFilesUseCase(scanner),
			getFileInfo: new GetFileInfoUseCase(scanner),
			subscribeToFile: new SubscribeToFileUseCase(watcher, repository, gitService),
			watchDirectory: new WatchDirectoryUseCase(watcher, repository, gitService),
			getEvents: new GetEventsUseCase(repository),
			// Expose infrastructure for advanced use cases
			watcher,
			scanner,
			repository,
			gitService,
			db,
		};
	}
}
