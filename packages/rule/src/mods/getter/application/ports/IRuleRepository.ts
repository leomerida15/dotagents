import { AgentRule } from '../../domain/entities/AgentRule';

export interface IRuleRepository {
	save(rule: AgentRule): Promise<void>;
}
