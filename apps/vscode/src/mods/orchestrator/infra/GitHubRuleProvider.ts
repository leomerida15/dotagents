import { IRuleProvider } from "@dotagents/diff";


export class GitHubRuleProvider implements IRuleProvider {
    async fetchAgentDefinitions(): Promise<any[]> {
        // Mock implementation: returns empty list for now.
        // In a real scenario, this would fetch from a GitHub repo.
        return [];
    }

    async fetchRuleRaw(agentId: string): Promise<string> {
        return '';
    }
}
