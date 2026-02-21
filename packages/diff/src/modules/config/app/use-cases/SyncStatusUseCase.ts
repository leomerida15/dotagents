import { Configuration } from '../../domain/entities/Configuration';
import type { IConfigRepository } from '../../domain/ports/IConfigRepository';
import { SyncStatusSchema, type SyncStatusDTO } from '../dto/SyncStatus.dto';
import { ConfigMapper } from '../mappers/ConfigMapper';
import { ProjectNotInitializedException } from '../exceptions/ConfigExceptions';

import type { SyncStatusResponseDTO } from '../dto/SyncStatus.dto';

export interface SyncStatusResult extends SyncStatusResponseDTO {
	needsInbound: string[]; // Agent -> .agents
	needsOutbound: string[]; // .agents -> Agent
}

interface SyncStatusUseCaseProps {
	configRepository: IConfigRepository;
}

export class SyncStatusUseCase {
	private readonly configRepository: IConfigRepository;

	constructor({ configRepository }: SyncStatusUseCaseProps) {
		this.configRepository = configRepository;
	}

	/**
	 * Analyzes the configuration and manifest to see who needs synchronization.
	 * @param input - The sync status request data.
	 */
	public async execute(input: SyncStatusDTO): Promise<SyncStatusResult> {
		const { workspaceRoot } = SyncStatusSchema.parse(input);

		let config: Configuration;
		try {
			config = await this.configRepository.load(workspaceRoot);
		} catch (e) {
			throw new ProjectNotInitializedException(workspaceRoot);
		}

		const manifest = config.manifest;
		const needsInbound: string[] = [];
		const needsOutbound: string[] = [];

		// Logic:
		// Outbound sync is needed when .agents timestamp > agent timestamp
		for (const agent of config.agents) {
			if (manifest.needsSync(agent.id)) {
				needsOutbound.push(agent.id);
			}
		}

		const configMapper = new ConfigMapper({ config, needsInbound, needsOutbound });

		return configMapper.toSyncStatusDTO();
	}
}
