import * as yaml from 'js-yaml';
import { createAgentId } from '../domain/agent-id.vo';
import { createProjectPath } from '../domain/project-path.vo';
import type { IConfigRepository } from '../domain/config-repository.port';
import type { ProjectConfig } from '../domain/project-config.entity';
import type { ConfigPath } from '../domain/config-path.vo';

/**
 * YAML-based implementation of the configuration repository.
 * Uses js-yaml for parsing and serializing YAML configuration files.
 */
export class YamlConfigRepository implements IConfigRepository {
	/**
	 * Loads a ProjectConfig from a YAML file.
	 * @param path - The path to the configuration file
	 * @returns The loaded ProjectConfig
	 * @throws Error if the file cannot be read/parsed
	 */
	async load(path: ConfigPath): Promise<ProjectConfig> {
		const pathStr = path as string;
		const file = Bun.file(pathStr);
		const exists = await file.exists();

		if (!exists) {
			throw new Error(`Configuration file not found: ${pathStr}`);
		}

		const content = await file.text();

		let parsed: Record<string, unknown>;
		try {
			parsed = yaml.load(content) as Record<string, unknown>;
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Unknown parsing error';
			throw new Error(`Failed to parse YAML configuration: ${message}`);
		}

		if (!parsed || typeof parsed !== 'object') {
			throw new Error('Invalid configuration format: expected an object');
		}

		const activeAgentStr = parsed.activeAgent as string | undefined;
		if (!activeAgentStr) {
			throw new Error('Invalid configuration: missing activeAgent');
		}

		const projectPathStr = parsed.projectPath as string | undefined;
		if (!projectPathStr) {
			throw new Error('Invalid configuration: missing projectPath');
		}

		const agentsArray = parsed.agents as string[] | undefined;
		const agents = agentsArray
			? agentsArray.map((a) => createAgentId(a))
			: [createAgentId(activeAgentStr)];

		const lastModifiedStr = parsed.lastModified as string | undefined;
		const lastModified = lastModifiedStr ? new Date(lastModifiedStr) : new Date();

		return {
			projectPath: createProjectPath(projectPathStr),
			activeAgent: createAgentId(activeAgentStr),
			agents,
			lastModified,
		};
	}

	/**
	 * Saves a ProjectConfig to a YAML file.
	 * @param config - The configuration to save
	 * @param path - The path to the configuration file
	 * @throws Error if the file cannot be written
	 */
	async save(config: ProjectConfig, path: ConfigPath): Promise<void> {
		const pathStr = path as string;
		const yamlContent = yaml.dump({
			activeAgent: config.activeAgent as string,
			agents: config.agents.map((a) => a as string),
			projectPath: config.projectPath as string,
			lastModified: config.lastModified?.toISOString(),
		});

		const file = Bun.file(pathStr);
		await file.write(yamlContent);
	}

	/**
	 * Checks if a configuration file exists.
	 * @param path - The path to check
	 * @returns true if the file exists
	 */
	async exists(path: ConfigPath): Promise<boolean> {
		const pathStr = path as string;
		const file = Bun.file(pathStr);
		return await file.exists();
	}
}
