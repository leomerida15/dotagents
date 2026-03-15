import type { IConfigRepository } from '../domain/config-repository.port';
import type { IPreferencesRepository } from '../domain/preferences-repository.port';
import type { AgentId } from '../domain/agent-id.vo';
import type { ProjectPath } from '../domain/project-path.vo';
import type { ConfigPath } from '../domain/config-path.vo';
import { createConfigPath } from '../domain/config-path.vo';
import { DEFAULT_CONFIG_PATH } from '../constants';

export interface GetActiveAgentParams {
	configRepository: IConfigRepository;
	preferencesRepository: IPreferencesRepository;
	projectPath: ProjectPath;
	configPath?: ConfigPath;
}

/**
 * Gets the active agent for a project.
 * First checks for project-specific config, then falls back to CLI preferences.
 * @param params - The parameters for getting the active agent
 * @returns The active AgentId
 * @throws Error if no active agent is found and no default is configured
 */
export async function getActiveAgent(params: GetActiveAgentParams): Promise<AgentId> {
	const {
		configRepository,
		preferencesRepository,
		projectPath,
		configPath: providedConfigPath,
	} = params;

	const configPath =
		providedConfigPath ?? createConfigPath(`${projectPath as string}/${DEFAULT_CONFIG_PATH}`);

	const configExists = await configRepository.exists(configPath);
	if (configExists) {
		const config = await configRepository.load(configPath);
		return config.activeAgent;
	}

	const preferences = await preferencesRepository.load();
	if (preferences.defaultAgent) {
		return preferences.defaultAgent;
	}

	throw new Error('No active agent found and no default agent configured');
}
