import { z } from 'zod/mini';

/**
 * Schema for Sync Status request inputs.
 */
export const SyncStatusSchema = z.object({
	workspaceRoot: z.string().check(z.minLength(1)),
	agentId: z.optional(z.string()), // If provided, check only one agent
});

/**
 * Data Transfer Object for SyncStatusUseCase.
 */
export type SyncStatusDTO = z.infer<typeof SyncStatusSchema>;

/**
 * Structure of the sync status response.
 */
export interface SyncStatusResponseDTO {
	lastActiveAgent: string;
	lastProcessedAt: number;
	outdatedAgents: string[];
}
