/**
 * Represents the timestamp of synchronization for an agent.
 * Value Object - immutable entity in the domain layer.
 */
export interface AgentTimestampProps {
    lastProcessedAt: number;
}

/**
 * AgentTimestamp Value Object
 *
 * Encapsulates the synchronization timestamp for an IDE/Agent.
 * This is an immutable value object following DDD principles.
 *
 * @example
 * ```typescript
 * const timestamp = AgentTimestamp.create({ lastProcessedAt: Date.now() });
 * console.log(timestamp.lastProcessedAt); // 1708053281000
 * ```
 */
export class AgentTimestamp {
    private readonly _lastProcessedAt: number;

    private constructor({ lastProcessedAt }: AgentTimestampProps) {
        this._lastProcessedAt = lastProcessedAt;
    }

    /**
     * Creates a new AgentTimestamp instance.
     * @param props - The properties containing the timestamp
     * @returns A new immutable AgentTimestamp instance
     */
    public static create(props: AgentTimestampProps): AgentTimestamp {
        return new AgentTimestamp(props);
    }

    /**
     * Creates a new AgentTimestamp with the current time.
     * @returns A new AgentTimestamp set to Date.now()
     */
    public static createNow(): AgentTimestamp {
        return new AgentTimestamp({ lastProcessedAt: Date.now() });
    }

    /**
     * Gets the timestamp value.
     * @returns The last processed timestamp in milliseconds
     */
    public get lastProcessedAt(): number {
        return this._lastProcessedAt;
    }

    /**
     * Serializes the AgentTimestamp to JSON format.
     * @returns Plain object representation
     */
    public toJSON(): AgentTimestampProps {
        return {
            lastProcessedAt: this._lastProcessedAt,
        };
    }
}
