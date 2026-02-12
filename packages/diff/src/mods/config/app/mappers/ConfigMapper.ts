import type { Configuration } from '../../domain/entities/Configuration';
import type { SyncStatusResult } from '../use-cases/SyncStatusUseCase';

interface ConfigMapperProps {
    config: Configuration,
    needsInbound: string[],
    needsOutbound: string[]
}

/**
 * Mapper for translating Configuration entities to SyncStatus DTOs.
 */
export class ConfigMapper {


    private config: Configuration;
    private needsInbound: string[];
    private needsOutbound: string[];

    constructor({
        config,
        needsInbound,
        needsOutbound,
    }: ConfigMapperProps) {
        this.config = config;
        this.needsInbound = needsInbound;
        this.needsOutbound = needsOutbound;
    }
    /**
     * Transforms a Configuration aggregate and its sync status into a DTO response.
     */
    public toSyncStatusDTO(): SyncStatusResult {
        const manifest = this.config.manifest;

        return {
            lastActiveAgent: manifest.lastActiveAgent,
            lastProcessedAt: manifest.lastProcessedAt,
            outdatedAgents: [...new Set([...this.needsInbound, ...this.needsOutbound])],
            needsInbound: this.needsInbound,
            needsOutbound: this.needsOutbound,
        };
    }
}
