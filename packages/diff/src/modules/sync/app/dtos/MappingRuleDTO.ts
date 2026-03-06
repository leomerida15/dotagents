import * as z from 'zod/mini';
import { MappingFormat } from '../../../config/domain/value-objects/MappingRule';

/**
 * Plain object representation of a MappingRule.
 */
export const MappingRuleSchema = z.object({
	from: z.string(),
	to: z.string(),
	format: z.optional(z.nativeEnum(MappingFormat)),
	sourceExt: z.optional(z.string()),
	targetExt: z.optional(z.string()),
	extract: z.optional(z.string()),
	adapter: z.optional(z.string()),
});

export type MappingRuleDTO = z.infer<typeof MappingRuleSchema>;
