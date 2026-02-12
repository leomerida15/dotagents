import { SyncAction } from '../../domain/entities/SyncAction';
import { SyncResult } from '../../domain/value-objects/SyncResult';
import type { SyncActionDTO } from './SyncActionDTO';
import type { SyncResultDTO } from './SyncResultDTO';

/**
 * Mapper to transform between Domain Entities/Value Objects and DTOs.
 */
export class SyncMapper {
    /**
     * Transforms a SyncAction domain entity into a DTO.
     */
    public static toActionDTO(action: SyncAction): SyncActionDTO {
        return {
            type: action.type,
            source: action.source,
            target: action.target,
            content: action.content,
            metadata: action.metadata
        };
    }

    /**
     * Transforms a SyncResult value object into a DTO.
     */
    public static toResultDTO(result: SyncResult): SyncResultDTO {
        return {
            status: result.status,
            actionsPerformed: result.actionsPerformed.map(this.toActionDTO),
            errors: result.errors.map(e => e.message),
            startedAt: result.startedAt,
            completedAt: result.completedAt,
            duration: result.duration
        };
    }
}
