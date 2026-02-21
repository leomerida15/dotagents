import { z } from 'zod/mini';

/**
 * Schema for Project Initialization inputs.
 */
export const InitializeProjectSchema = z.object({
	workspaceRoot: z.string().check(z.minLength(1)),
	force: z._default(z.boolean(), false),
});

/**
 * Data Transfer Object for InitializeProjectUseCase.
 */
export type InitializeProjectDTO = z.infer<typeof InitializeProjectSchema>;
