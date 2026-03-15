/**
 * Zod validation schemas for MCP tool inputs.
 * Provides type-safe validation and TypeScript inference.
 */

import { z } from 'zod';

/**
 * Schema for list_directory tool input.
 */
export const ListDirectorySchema = z.object({
	path: z.string().min(1, 'Path is required'),
	recursive: z.boolean().optional().default(false),
	include: z.array(z.string()).optional().default([]),
	exclude: z.array(z.string()).optional().default([]),
	respectGitignore: z.boolean().optional().default(true),
	followSymlinks: z.boolean().optional().default(false),
	maxDepth: z.number().int().positive().optional(),
});

/**
 * Schema for get_file_info tool input.
 */
export const GetFileInfoSchema = z.object({
	path: z.string().min(1, 'Path is required'),
});

/**
 * Schema for subscribe_to_file tool input.
 */
export const SubscribeToFileSchema = z.object({
	path: z.string().min(1, 'Path is required'),
});

/**
 * Schema for watch_directory tool input.
 */
export const WatchDirectorySchema = z.object({
	path: z.string().min(1, 'Path is required'),
	recursive: z.boolean().optional().default(true),
	include: z.array(z.string()).optional().default([]),
	exclude: z.array(z.string()).optional().default([]),
	respectGitignore: z.boolean().optional().default(true),
	maxDepth: z.number().int().positive().optional(),
	debounceMs: z.number().int().nonnegative().optional().default(200),
});

/**
 * Schema for get_events tool input.
 */
export const GetEventsSchema = z.object({
	path: z.string().optional(),
	since: z.string().datetime().optional(),
	until: z.string().datetime().optional(),
	types: z
		.array(z.enum(['CREATED', 'MODIFIED', 'DELETED', 'RENAMED']))
		.optional()
		.default([]),
	limit: z.number().int().min(1).max(1000).optional().default(100),
	offset: z.number().int().min(0).optional().default(0),
});

// Type inference exports
export type ListDirectoryInput = z.infer<typeof ListDirectorySchema>;
export type GetFileInfoInput = z.infer<typeof GetFileInfoSchema>;
export type SubscribeToFileInput = z.infer<typeof SubscribeToFileSchema>;
export type WatchDirectoryInput = z.infer<typeof WatchDirectorySchema>;
export type GetEventsInput = z.infer<typeof GetEventsSchema>;
