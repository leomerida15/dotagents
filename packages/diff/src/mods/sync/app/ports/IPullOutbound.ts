import type { PullOutboundRequestDTO } from '../dtos/PullOutboundRequestDTO';
import type { SyncResultDTO } from '../dtos/SyncResultDTO';

/**
 * Interface for the PullOutbound use case.
 */
export interface IPullOutbound {
	execute(request: PullOutboundRequestDTO): Promise<SyncResultDTO>;
}
