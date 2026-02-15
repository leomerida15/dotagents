import { AgentID } from '../../../../shared/domain/value-objects/AgentId';
import { RuleSourceType } from '../../../../shared/domain/value-objects/RuleSource';
import type { IGetterConfigService } from '../ports/IGetterConfigService';
import type { IRuleProvider } from '../ports/IRuleProvider';
import type { IRuleRepository } from '../ports/IRuleRepository';
import type { GetRuleRequestDTO } from '../dtos/GetRuleRequestDTO';
import type { AgentRuleDTO, MappingDTO } from '../dtos/AgentRuleDTO';
import { AgentRule } from '../../domain/entities/AgentRule';

export class GetAgentRuleUseCase {
	constructor(
		private readonly configService: IGetterConfigService,
		private readonly githubProvider: IRuleProvider,
		private readonly localProvider: IRuleProvider,
		private readonly ruleRepository: IRuleRepository,
	) {}

	async execute(request: GetRuleRequestDTO): Promise<AgentRuleDTO> {
		const agentId = new AgentID(request.agentId);

		// 1. Determine source
		const sourceType = this.configService.getRuleSourceType();
		const provider =
			sourceType === RuleSourceType.GITHUB ? this.githubProvider : this.localProvider;

		// 2. Fetch Rule
		const rule = await provider.getRule(agentId);

		if (!rule) {
			throw new Error(`Agent rule not found for: ${agentId}`);
		}

		// 3. Persist to Cache (Repository)
		await this.ruleRepository.save(rule);

		// 4. Return Mapping (DTO)
		return this.toDTO(rule);
	}

	private toDTO(rule: AgentRule): AgentRuleDTO {
		return {
			id: rule.id.toString(),
			name: rule.name,
			sourceRoot: rule.sourceRoot,
			inbound: rule.inbound.map(this.mapMapping),
			outbound: rule.outbound.map(this.mapMapping),
			source: {
				type: rule.source.type,
				location: rule.source.location,
			},
		};
	}

	private mapMapping(m: any): MappingDTO {
		return {
			from: m.from,
			to: m.to,
			format: m.format,
		};
	}
}
