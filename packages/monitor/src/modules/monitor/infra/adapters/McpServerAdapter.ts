/**
 * McpServerAdapter - MCP server implementation with stdio transport.
 * Exposes monitor functionality through 5 MCP tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { ListFilesUseCase } from '../../app/use-cases/ListFilesUseCase';
import type { GetFileInfoUseCase } from '../../app/use-cases/GetFileInfoUseCase';
import type { SubscribeToFileUseCase } from '../../app/use-cases/SubscribeToFileUseCase';
import type { WatchDirectoryUseCase } from '../../app/use-cases/WatchDirectoryUseCase';
import type { GetEventsUseCase } from '../../app/use-cases/GetEventsUseCase';
import {
	ListDirectorySchema,
	GetFileInfoSchema,
	SubscribeToFileSchema,
	WatchDirectorySchema,
	GetEventsSchema,
} from '../../app/dto/schemas';

/**
 * Dependencies required by the MCP server adapter.
 */
export interface McpServerAdapterDeps {
	listFilesUseCase: ListFilesUseCase;
	getFileInfoUseCase: GetFileInfoUseCase;
	subscribeToFileUseCase: SubscribeToFileUseCase;
	watchDirectoryUseCase: WatchDirectoryUseCase;
	getEventsUseCase: GetEventsUseCase;
}

/**
 * MCP server adapter exposing monitor tools via stdio transport.
 */
export class McpServerAdapter {
	private server: Server;
	private transport: StdioServerTransport;

	constructor(private readonly deps: McpServerAdapterDeps) {
		this.server = new Server(
			{
				name: 'dotagents-monitor',
				version: '0.1.0',
			},
			{
				capabilities: {
					tools: {},
				},
			},
		);

		this.transport = new StdioServerTransport();
		this.setupHandlers();
	}

	/**
	 * Start the MCP server.
	 */
	async start(): Promise<void> {
		await this.server.connect(this.transport);
		console.error('MCP Monitor server started on stdio');
	}

	/**
	 * Stop the MCP server.
	 */
	async stop(): Promise<void> {
		await this.server.close();
	}

	private setupHandlers(): void {
		// List available tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return {
				tools: [
					{
						name: 'list_directory',
						description: 'List files and directories with metadata',
						inputSchema: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'Directory path' },
								recursive: { type: 'boolean', description: 'List recursively' },
								include: {
									type: 'array',
									items: { type: 'string' },
									description: 'Glob patterns to include',
								},
								exclude: {
									type: 'array',
									items: { type: 'string' },
									description: 'Glob patterns to exclude',
								},
							},
							required: ['path'],
						},
					},
					{
						name: 'get_file_info',
						description: 'Get metadata for a single file',
						inputSchema: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'File path' },
							},
							required: ['path'],
						},
					},
					{
						name: 'subscribe_to_file',
						description: 'Subscribe to changes on a specific file',
						inputSchema: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'File path to watch' },
							},
							required: ['path'],
						},
					},
					{
						name: 'watch_directory',
						description: 'Watch a directory for changes',
						inputSchema: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'Directory path' },
								recursive: {
									type: 'boolean',
									description: 'Watch recursively',
								},
								include: {
									type: 'array',
									items: { type: 'string' },
									description: 'Glob patterns to include',
								},
								exclude: {
									type: 'array',
									items: { type: 'string' },
									description: 'Glob patterns to exclude',
								},
							},
							required: ['path'],
						},
					},
					{
						name: 'get_events',
						description: 'Query file change events',
						inputSchema: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'Filter by path' },
								limit: { type: 'number', description: 'Max results' },
								offset: { type: 'number', description: 'Pagination offset' },
								types: {
									type: 'array',
									items: {
										enum: ['CREATED', 'MODIFIED', 'DELETED', 'RENAMED'],
									},
									description: 'Event types to include',
								},
							},
						},
					},
				],
			};
		});

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				switch (name) {
					case 'list_directory': {
						const input = ListDirectorySchema.parse(args);
						const files = await this.deps.listFilesUseCase.execute(input);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(files, null, 2),
								},
							],
						};
					}

					case 'get_file_info': {
						const input = GetFileInfoSchema.parse(args);
						const info = await this.deps.getFileInfoUseCase.execute(input);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(info, null, 2),
								},
							],
						};
					}

					case 'subscribe_to_file': {
						const input = SubscribeToFileSchema.parse(args);
						const result = await this.deps.subscribeToFileUseCase.execute(input);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(
										{
											subscriptionId: result.subscriptionId,
											message: `Subscribed to ${input.path}`,
										},
										null,
										2,
									),
								},
							],
						};
					}

					case 'watch_directory': {
						const input = WatchDirectorySchema.parse(args);
						const result = await this.deps.watchDirectoryUseCase.execute(input);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(
										{
											watchId: result.watchId,
											message: `Watching ${input.path}`,
										},
										null,
										2,
									),
								},
							],
						};
					}

					case 'get_events': {
						const input = GetEventsSchema.parse(args);
						const events = await this.deps.getEventsUseCase.execute(input);
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify(events, null, 2),
								},
							],
						};
					}

					default:
						throw new Error(`Unknown tool: ${name}`);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({ error: message }, null, 2),
						},
					],
					isError: true,
				};
			}
		});
	}
}
