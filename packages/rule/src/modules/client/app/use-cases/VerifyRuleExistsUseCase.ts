import { IInstalledRuleRepository } from '@rule/modules/client/app/ports/IInstalledRuleRepository';
import { AgentID, RuleExistenceDTO } from '@rule/modules/client';

export class VerifyRuleExistsUseCase {
	constructor(private readonly repository: IInstalledRuleRepository) { }

	async execute(agentId: string): Promise<RuleExistenceDTO> {
		const id = new AgentID(agentId);
		const exists = this.repository.existsRule(id);

		return {
			agentId: id.toString(),
			exists,
		};
	}
}
