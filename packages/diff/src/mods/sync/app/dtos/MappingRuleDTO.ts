import * as z from 'zod/mini';
import { MappingFormat } from '../../../config/domain/value-objects/MappingRule';

/**
 * Plain object representation of a MappingRule.
 */
export const MappingRuleSchema = z.object({
    from: z.string(),
    to: z.string(),
    format: z.optional(z.nativeEnum(MappingFormat)),
});

export type MappingRuleDTO = z.infer<typeof MappingRuleSchema>;
