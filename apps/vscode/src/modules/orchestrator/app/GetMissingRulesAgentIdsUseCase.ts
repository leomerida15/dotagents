import { join } from 'node:path';
import type { IConfigRepository } from '@dotagents/diff';
import { ClientModule } from '@dotagents/rule';

export interface GetMissingRulesAgentIdsUseCaseProps {
	configRepository: IConfigRepository;
}

/**
 * Returns agent ids that have no rule file in .agents/.ai/rules/.
 * Call after FetchAndInstallRules to detect tools that need rules created (e.g. via make_rule.md).
 */
export class GetMissingRulesAgentIdsUseCase {
	private readonly configRepository: IConfigRepository;

	constructor({ configRepository }: GetMissingRulesAgentIdsUseCaseProps) {
		this.configRepository = configRepository;
	}

	async execute(workspaceRoot: string): Promise<string[]> {
		const config = await this.configRepository.load(workspaceRoot);
		const agentIds = config.agents.map((a) => a.id);
		if (agentIds.length === 0) return [];

		const rulesPath = join(workspaceRoot, '.agents', '.ai', 'rules');
		const verifyUseCase = ClientModule.createVerifyRulesExistenceUseCase(rulesPath);
		const results = await verifyUseCase.execute(agentIds);
		return results.filter((r) => !r.exists).map((r) => r.agentId);
	}
}
