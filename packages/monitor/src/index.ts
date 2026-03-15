/**
 * @dotagents/monitor - File System Monitoring with MCP Server
 *
 * A comprehensive monitoring package for file system observation capabilities,
 * providing real-time file change detection, directory scanning, and event
 * persistence with Git integration, exposed through an MCP server interface.
 */

// Module factory
export { MonitorModule } from './modules/monitor/MonitorModule';

// Domain - Entities
export { FileEvent } from './modules/monitor/domain/entities/FileEvent';
export { FileSnapshot } from './modules/monitor/domain/entities/FileSnapshot';

// Domain - Value Objects
export { EventType } from './modules/monitor/domain/value-objects/EventType';
export { FilePath } from './modules/monitor/domain/value-objects/FilePath';
export { ContentHash } from './modules/monitor/domain/value-objects/ContentHash';
export { GitInfo } from './modules/monitor/domain/value-objects/GitInfo';

// Domain - Ports
export type { IFileWatcher, WatchOptions } from './modules/monitor/domain/ports/IFileWatcher';
export type {
	IDirectoryScanner,
	ScanOptions,
} from './modules/monitor/domain/ports/IDirectoryScanner';
export type {
	IEventRepository,
	EventFilters,
} from './modules/monitor/domain/ports/IEventRepository';
export type { IGitService } from './modules/monitor/domain/ports/IGitService';

// Application - Use Cases
export { ListFilesUseCase } from './modules/monitor/app/use-cases/ListFilesUseCase';
export { GetFileInfoUseCase } from './modules/monitor/app/use-cases/GetFileInfoUseCase';
export { SubscribeToFileUseCase } from './modules/monitor/app/use-cases/SubscribeToFileUseCase';
export { WatchDirectoryUseCase } from './modules/monitor/app/use-cases/WatchDirectoryUseCase';
export { GetEventsUseCase } from './modules/monitor/app/use-cases/GetEventsUseCase';

// Application - DTO Schemas
export {
	ListDirectorySchema,
	GetFileInfoSchema,
	SubscribeToFileSchema,
	WatchDirectorySchema,
	GetEventsSchema,
	type ListDirectoryInput,
	type GetFileInfoInput,
	type SubscribeToFileInput,
	type WatchDirectoryInput,
	type GetEventsInput,
} from './modules/monitor/app/dto/schemas';

// Infrastructure - Adapters
export { FsFileWatcher } from './modules/monitor/infra/adapters/FsFileWatcher';
export { FsDirectoryScanner } from './modules/monitor/infra/adapters/FsDirectoryScanner';
export { McpServerAdapter } from './modules/monitor/infra/adapters/McpServerAdapter';
export { GitCliService } from './modules/monitor/infra/adapters/GitCliService';

// Infrastructure - Repositories
export { PgliteEventRepository } from './modules/monitor/infra/repositories/PgliteEventRepository';

// Infrastructure - Utils
export {
	Observable,
	type Observer,
	type Subscription,
} from './modules/monitor/infra/utils/Observable';

// Configuration types
export type { MonitorOptions } from './modules/monitor/MonitorModule';
