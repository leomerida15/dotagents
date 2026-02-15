import { InstalledRule, AgentID } from '@rule/mods/client';

export interface IInstalledRuleRepository {
	getRule(agentId: AgentID): InstalledRule | null;
	getAllRules(): InstalledRule[];
}
