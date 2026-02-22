import { IInstalledRuleRepository } from '@rule/modules/client/app/ports/IInstalledRuleRepository';
import { InstalledRule, AgentID, InstalledRuleDTO } from '@rule/modules/client';

export class GetInstalledRuleUseCase {
	constructor(private readonly repository: IInstalledRuleRepository) { }

	async execute(agentId: string): Promise<InstalledRuleDTO | null> {
		const id = new AgentID(agentId);
		const rule = await this.repository.getRule(id);

		if (!rule) {
			return null;
		}

		return this.toDTO(rule);
	}

	private toDTO(rule: InstalledRule): InstalledRuleDTO {
		const mapRule = (m: (typeof rule.inbound)[0]) => ({
			from: m.from,
			to: m.to,
			format: m.format,
			...(m.sourceExt != null && { sourceExt: m.sourceExt }),
			...(m.targetExt != null && { targetExt: m.targetExt }),
		});
		return {
			id: rule.id.toString(),
			name: rule.name,
			sourceRoot: rule.sourceRoot,
			mappings: {
				inbound: rule.inbound.map(mapRule),
				outbound: rule.outbound.map(mapRule),
			},
			ui: {
				icon: rule.ui.icon,
				color: rule.ui.color,
				description: rule.ui.description,
			},
			installedAt: rule.installedAt.toISOString(),
		};
	}
}
