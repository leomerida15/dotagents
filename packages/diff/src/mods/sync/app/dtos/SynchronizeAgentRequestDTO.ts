import * as z from 'zod/mini';

export const SynchronizeAgentRequestSchema = z.object({
    agentId: z.string(),
    workspaceRoot: z.string(),
});

export type SynchronizeAgentRequestDTO = z.infer<typeof SynchronizeAgentRequestSchema>;
