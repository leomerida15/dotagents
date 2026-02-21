import type { SynchronizeAgentRequestDTO } from '../dtos/SynchronizeAgentRequestDTO';
import type { SyncResultDTO } from '../dtos/SyncResultDTO';

/**
 * Interface for the SynchronizeAgent use case.
 */
export interface ISynchronizeAgent {
	execute(request: SynchronizeAgentRequestDTO): Promise<SyncResultDTO>;
}
