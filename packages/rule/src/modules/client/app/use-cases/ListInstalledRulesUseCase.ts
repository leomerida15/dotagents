import { InstalledRule } from '@rule/modules/client';
import { IInstalledRuleRepository } from '@rule/modules/client/app/ports/IInstalledRuleRepository';
import { InstalledRuleDTO } from '@rule/modules/client/app/dtos/InstalledRuleDTO';

export class ListInstalledRulesUseCase {
	constructor(private readonly repository: IInstalledRuleRepository) { }

	async execute(): Promise<InstalledRuleDTO[]> {
		const rules = await this.repository.getAllRules();
		return rules.map(this.toDTO);
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
