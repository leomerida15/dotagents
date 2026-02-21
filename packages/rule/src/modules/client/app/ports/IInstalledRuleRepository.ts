import { InstalledRule, AgentID } from '@rule/modules/client';

export interface IInstalledRuleRepository {
	getRule(agentId: AgentID): InstalledRule | null;
	existsRule(agentId: AgentID): boolean;
	getAllRules(): InstalledRule[];
}
