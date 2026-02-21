import * as z from 'zod/mini';
import { MappingRuleSchema } from './MappingRuleDTO';

export const SyncProjectRequestSchema = z.object({
	rules: z.array(MappingRuleSchema),
	sourcePath: z.string(),
	targetPath: z.string(),
	affectedPaths: z.array(z.string()).optional(),
});

export type SyncProjectRequestDTO = z.infer<typeof SyncProjectRequestSchema>;
