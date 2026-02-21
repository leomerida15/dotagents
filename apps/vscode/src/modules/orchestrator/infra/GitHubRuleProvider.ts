import type { AgentProps } from '@dotagents/diff';
import { IRuleProvider } from '@dotagents/diff';
import type { ILogger } from '../app/ports/ILogger';

const DEFAULT_BASE_URL =
	process.env.DOTAGENTS_GITHUB_RULES_URL ??
	'https://raw.githubusercontent.com/leomerida15/dotagents/main';

export interface GitHubRuleProviderProps {
	baseUrl?: string;
	rulesPath?: string;
	logger?: ILogger;
}

/**
 * Fetches agent rules from leomerida15/dotagents (or configurable repo).
 * Structure: {baseUrl}/rules/{agentId}.yaml
 */
export class GitHubRuleProvider implements IRuleProvider {
	private readonly baseUrl: string;
	private readonly rulesPath: string;
	private readonly logger: ILogger | undefined;

	constructor({ baseUrl = DEFAULT_BASE_URL, rulesPath = 'rules', logger }: GitHubRuleProviderProps = {}) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
		this.rulesPath = rulesPath.replace(/^\/|\/$/g, '');
		this.logger = logger;
	}

	async fetchAgentDefinitions(): Promise<AgentProps[]> {
		return [];
	}

	async fetchRuleRaw(agentId: string): Promise<string> {
		const url = `${this.baseUrl}/${this.rulesPath}/${agentId}.yaml`;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				if (response.status === 404) return '';
				throw new Error(`Failed to fetch rule: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			if (this.logger) this.logger.warn(`Could not fetch rule for ${agentId} from ${url}:`, error);
			else console.warn(`Could not fetch rule for ${agentId} from ${url}:`, error);
			return '';
		}
	}
}
