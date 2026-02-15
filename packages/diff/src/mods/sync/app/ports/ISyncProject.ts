import type { SyncProjectRequestDTO } from '../dtos/SyncProjectRequestDTO';
import type { SyncResultDTO } from '../dtos/SyncResultDTO';

/**
 * Interface for the SyncProject use case.
 */
export interface ISyncProject {
	execute(request: SyncProjectRequestDTO): Promise<SyncResultDTO>;
}
