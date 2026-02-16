import { IInstalledRuleRepository } from '@rule/mods/client/app/ports/IInstalledRuleRepository';
import { InstalledRule, AgentID, InstalledRuleDTO } from '@rule/mods/client';

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
		return {
			id: rule.id.toString(),
			name: rule.name,
			sourceRoot: rule.sourceRoot,
			mappings: {
				inbound: rule.inbound.map((m) => ({ from: m.from, to: m.to, format: m.format })),
				outbound: rule.outbound.map((m) => ({ from: m.from, to: m.to, format: m.format })),
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
