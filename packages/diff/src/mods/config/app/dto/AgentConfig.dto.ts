
/**
 * Representa la configuración de un agente de IA/IDE.
 */
export interface AgentConfigDTO {
    id: string;
    name: string;
    sourceRoot: string;
    inbound?: any[]; // Podríamos definir MappingRuleDTO si fuera necesario, por ahora any es aceptable o mejor usar MappingRuleDTO del dominio si existiera
    outbound?: any[];
}

/**
 * Representa los timestamps de sincronización de un agente.
 */
export interface AgentTimestampDTO {
    lastProcessedAt: number;
}

/**
 * Data Transfer Object para el manifiesto de sincronización.
 */
export interface SyncManifestDTO {
    lastProcessedAt: number;
    lastActiveAgent: string;
    currentAgent: string | null;
    agents: Record<string, AgentTimestampDTO>;
}
