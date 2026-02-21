import * as z from 'zod/mini';
import { SyncActionSchema } from './SyncActionDTO';

/**
 * Data Transfer Object for SyncResult.
 * Used to return the synchronization summary to the caller (CLI, UI, etc.)
 */
export const SyncResultSchema = z.object({
	status: z.enum(['success', 'failure', 'partial']),
	actionsPerformed: z.array(SyncActionSchema),
	errors: z.optional(z.array(z.string())),
	startedAt: z.number(),
	completedAt: z.optional(z.number()),
	duration: z.number(),
});

export type SyncResultDTO = z.infer<typeof SyncResultSchema>;
