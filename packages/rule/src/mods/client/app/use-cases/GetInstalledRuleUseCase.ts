import type { IInstalledRuleRepository } from '@rule/mods/client/app/ports/IInstalledRuleRepository';
import { InstalledRule, AgentID, type InstalledRuleDTO } from '@rule/mods/client';

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
			mappings: {
				inbound: rule.inbound.map((m) => ({ from: m.from, to: m.to, format: m.format })),
				outbound: rule.outbound.map((m) => ({ from: m.from, to: m.to, format: m.format })),
			},
			installedAt: rule.installedAt.toISOString(),
		};
	}
}
