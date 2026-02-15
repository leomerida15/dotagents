import * as z from 'zod/mini';

export const PullOutboundRequestSchema = z.object({
	agentId: z.string(),
	workspaceRoot: z.string(),
});

export type PullOutboundRequestDTO = z.infer<typeof PullOutboundRequestSchema>;
