import * as z from 'zod/mini';
import { ActionType } from '../../domain/value-objects/ActionType';

/**
 * Data Transfer Object for SyncAction.
 * Represented as a plain object for use in APIs, CLI, or communication between layers.
 */
export const SyncActionSchema = z.object({
	type: z.enum(ActionType),
	source: z.optional(z.string()),
	target: z.string(),
	content: z.optional(z.union([z.string(), z.record(z.any(), z.any())])),
	metadata: z.optional(z.record(z.any(), z.any())),
});

export type SyncActionDTO = z.infer<typeof SyncActionSchema>;
