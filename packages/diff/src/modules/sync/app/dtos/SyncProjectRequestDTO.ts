import * as z from 'zod/mini';
import { MappingRuleSchema } from './MappingRuleDTO';

export const SyncProjectRequestSchema = z.object({
	rules: z.array(MappingRuleSchema),
	sourcePath: z.string(),
	targetPath: z.string(),
	affectedPaths: z.optional(z.array(z.string())),
});

export type SyncProjectRequestDTO = z.infer<typeof SyncProjectRequestSchema>;
