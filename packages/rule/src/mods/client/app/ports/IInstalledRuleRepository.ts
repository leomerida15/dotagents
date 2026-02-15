import { InstalledRule, AgentID } from '@rule/mods/client';

export interface IInstalledRuleRepository {
	getRule(agentId: AgentID): Promise<InstalledRule | null>;
	getAllRules(): Promise<InstalledRule[]>;
}
