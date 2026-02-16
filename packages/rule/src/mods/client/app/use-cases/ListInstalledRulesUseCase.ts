import { InstalledRule } from '@rule/mods/client';
import { IInstalledRuleRepository } from '@rule/mods/client/app/ports/IInstalledRuleRepository';
import { InstalledRuleDTO } from '@rule/mods/client/app/dtos/InstalledRuleDTO';

export class ListInstalledRulesUseCase {
	constructor(private readonly repository: IInstalledRuleRepository) { }

	async execute(): Promise<InstalledRuleDTO[]> {
		const rules = await this.repository.getAllRules();
		return rules.map(this.toDTO);
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
