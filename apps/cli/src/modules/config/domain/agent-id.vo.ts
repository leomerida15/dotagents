/**
 * Unique identifier for an agent (e.g., 'cursor', 'claude', 'copilot', 'gemini').
 * Branded type for type-safety and validation.
 */
export type AgentId = string & { readonly __brand: unique symbol };

/**
 * Factory function to create a validated AgentId.
 * Normalizes the ID to lowercase and trims whitespace.
 * @param id - The agent identifier string
 * @returns A branded AgentId
 * @throws Error if id is empty
 */
export function createAgentId(id: string): AgentId {
	if (!id || id.trim() === '') {
		throw new Error('Agent ID cannot be empty');
	}
	return id.toLowerCase().trim() as AgentId;
}

/**
 * Checks if a value is a valid AgentId.
 * @param value - The value to check
 * @returns true if the value is a non-empty string
 */
export function isAgentId(value: unknown): value is AgentId {
	return typeof value === 'string' && value.trim() !== '';
}
