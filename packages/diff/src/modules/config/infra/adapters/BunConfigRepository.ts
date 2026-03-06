import { join } from 'node:path';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { Configuration } from '../../domain/entities/Configuration';
import { SyncManifest } from '../../domain/entities/SyncManifest';
import { Agent } from '../../domain/entities/Agent';
import { AgentTimestamp } from '../../domain/value-objects/AgentTimestamp';
import { MappingRule } from '../../domain/value-objects/MappingRule';
import type { IConfigRepository } from '../../domain/ports/IConfigRepository';

/**
 * Properties for configuring the BunConfigRepository.
 */
interface BunConfigRepositoryProps {
	dotAgentsFolder?: string;
	syncFile?: string;
}

/**
 * Interface for the data structure saved on disk.
 */
interface PersistedConfigData {
	manifest: any;
	agents: any[];
}

/**
 * Bun-specific implementation of IConfigRepository.
 * Persists configuration to .agents/.ai/state.json.
 */
export class BunConfigRepository implements IConfigRepository {
	private readonly DOT_AGENTS_FOLDER: string;
	private readonly SYNC_FILE: string;

	/**
	 * Creates a Bun repository for reading and persisting sync state.
	 *
	 * @param props - Optional configuration for folder and state file names
	 */
	constructor({
		dotAgentsFolder = '.agents',
		syncFile = 'state.json',
	}: BunConfigRepositoryProps = {}) {
		this.DOT_AGENTS_FOLDER = dotAgentsFolder;
		this.SYNC_FILE = syncFile;
	}

	/**
	 * Saves the configuration to the workspace.
	 * @param config - The configuration object to save.
	 */
	public async save(config: Configuration): Promise<void> {
		const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
		const aiPath = join(agentsPath, '.ai');
		const syncPath = join(aiPath, this.SYNC_FILE);

		await mkdir(agentsPath, { recursive: true });
		await mkdir(aiPath, { recursive: true });

		const data: PersistedConfigData = {
			manifest: config.manifest.toJSON(),
			agents: config.agents.map((agent) => ({
				id: agent.id,
				name: agent.name,
				sourceRoot: agent.sourceRoot,
				inbound: agent.inboundRules.map((rule) => ({
					from: rule.from,
					to: rule.to,
					format: rule.format,
					...(rule.sourceExt != null && { sourceExt: rule.sourceExt }),
					...(rule.targetExt != null && { targetExt: rule.targetExt }),
				})),
				outbound: agent.outboundRules.map((rule) => ({
					from: rule.from,
					to: rule.to,
					format: rule.format,
					...(rule.sourceExt != null && { sourceExt: rule.sourceExt }),
					...(rule.targetExt != null && { targetExt: rule.targetExt }),
				})),
			})),
		};

		await writeFile(syncPath, JSON.stringify(data, null, 2));

		await mkdir(join(agentsPath, 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'skills'), { recursive: true });
		await mkdir(join(agentsPath, 'mcp'), { recursive: true });
	}

	/**
	 * Checks if the configuration file exists in the workspace.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns True if the configuration exists, false otherwise.
	 */
	public async exists(workspaceRoot: string): Promise<boolean> {
		const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);
		try {
			await access(syncPath, constants.F_OK);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Loads the configuration from the workspace.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns The loaded configuration object.
	 */
	public async load(workspaceRoot: string): Promise<Configuration> {
		const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);

		try {
			const fileContent = await readFile(syncPath, 'utf8');
			const data = JSON.parse(fileContent) as PersistedConfigData;

			const rawAgents = data.manifest?.agents ?? {};
			const manifestAgents = Object.fromEntries(
				Object.entries(rawAgents)
					.filter(([key]) => key !== 'agents')
					.map(([key, value]) => [
						key,
						AgentTimestamp.create(value as { lastProcessedAt: number }),
					]),
			);
			const manifest = SyncManifest.create({
				...data.manifest,
				agents: manifestAgents,
			});

			const agents = (data.agents || []).map((agentProps) => {
				return Agent.create({
					...agentProps,
					inbound: (agentProps.inbound || []).map((r: any) => MappingRule.create(r)),
					outbound: (agentProps.outbound || []).map((r: any) => MappingRule.create(r)),
				});
			});

			return Configuration.create({
				workspaceRoot,
				agents,
				manifest,
			});
		} catch (error) {
			throw new Error(`Could not load configuration from ${syncPath}: ${error}`);
		}
	}
}
