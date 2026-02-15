import { AgentID } from '../../../../shared/domain/value-objects/AgentId';
import { AgentRule } from '../../domain/entities/AgentRule';

export interface IRuleProvider {
	getRule(agentId: AgentID): Promise<AgentRule | null>;
}
