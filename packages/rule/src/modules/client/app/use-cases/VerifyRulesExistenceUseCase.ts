import { IInstalledRuleRepository } from '@rule/modules/client/app/ports/IInstalledRuleRepository';
import { AgentID, RuleExistenceDTO } from '@rule/modules/client';

export class VerifyRulesExistenceUseCase {
	constructor(private readonly repository: IInstalledRuleRepository) { }

	async execute(agentIds: string[]): Promise<RuleExistenceDTO[]> {
		return agentIds.map((agentId) => {
			const id = new AgentID(agentId);
			const exists = this.repository.existsRule(id);

			return {
				agentId: id.toString(),
				exists,
			};
		});
	}
}
