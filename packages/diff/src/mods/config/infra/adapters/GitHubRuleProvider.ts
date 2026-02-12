import type { AgentProps } from '../../domain/entities/Agent';
import type { IRuleProvider } from '../../domain/ports/IRuleProvider';

interface GitHubRuleProviderProps {
    baseUrl?: string;
}

export class GitHubRuleProvider implements IRuleProvider {
    private readonly GITHUB_RAW_BASE_URL: string;

    constructor({ baseUrl }: GitHubRuleProviderProps = {}) {
        this.GITHUB_RAW_BASE_URL = baseUrl ?? 'https://raw.githubusercontent.com/snor/dotai-rules/main';
    }

    /**
     * Fetches agent definitions from the centralized GitHub repository.
     * Note: In a real implementation, this would list the directory first or fetch a master index.
     */
    public async fetchAgentDefinitions(): Promise<AgentProps[]> {
        try {
            // For now, we simulate fetching from a master index.json file in the repo
            const response = await fetch(`${this.GITHUB_RAW_BASE_URL}/index.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch rules from GitHub: ${response.statusText}`);
            }
            return await response.json() as AgentProps[];
        } catch (error) {
            console.warn('Could not fetch rules from GitHub, using local fallback if available.', error);
            return [];
        }
    }

    public async fetchRuleRaw(agentId: string): Promise<string> {
        const response = await fetch(`${this.GITHUB_RAW_BASE_URL}/agents/${agentId}.yaml`);
        if (!response.ok) {
            throw new Error(`Failed to fetch raw rule for ${agentId}: ${response.statusText}`);
        }
        return await response.text();
    }
}
