import * as z from 'zod/mini';

export const SynchronizeAgentRequestSchema = z.object({
	agentId: z.string(),
	workspaceRoot: z.string(),
	force: z.optional(z.boolean()),
	enableDelete: z.optional(z.boolean()),
});

export type SynchronizeAgentRequestDTO = z.infer<typeof SynchronizeAgentRequestSchema>;
