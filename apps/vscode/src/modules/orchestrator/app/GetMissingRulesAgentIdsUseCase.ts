import { join } from 'node:path';
import type { IConfigRepository } from '@dotagents/diff';
import { ClientModule } from '@dotagents/rule';

/**
 * Properties for initializing GetMissingRulesAgentIdsUseCase
 */
export interface GetMissingRulesAgentIdsUseCaseProps {
	configRepository: IConfigRepository;
}

/**
 * Returns agent ids that have no rule file in .agents/.ai/rules/.
 * Call after FetchAndInstallRules to detect tools that need rules created (e.g. via make_rule.md).
 */
export class GetMissingRulesAgentIdsUseCase {
	private readonly configRepository: IConfigRepository;

	/**
	 * Creates a use case that identifies agents without installed rule files.
	 *
	 * @param props - Dependencies required for rule existence checks
	 */
	constructor({ configRepository }: GetMissingRulesAgentIdsUseCaseProps) {
		this.configRepository = configRepository;
	}

	/**
	 * Returns agent ids that have no rule file in .agents/.ai/rules/.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @param options - Optional parameters including specific agentIds to check.
	 * @returns Array of agent IDs missing rule files.
	 */
	async execute(workspaceRoot: string, options?: { agentIds?: string[] }): Promise<string[]> {
		const config = await this.configRepository.load(workspaceRoot);
		const agentIds = options?.agentIds ?? config.agents.map((agent) => agent.id);
		if (agentIds.length === 0) return [];

		const rulesPath = join(workspaceRoot, '.agents', '.ai', 'rules');
		const verifyUseCase = ClientModule.createVerifyRulesExistenceUseCase(rulesPath);
		const results = await verifyUseCase.execute(agentIds);
		return results.filter((r) => !r.exists).map((r) => r.agentId);
	}
}
