import { join } from 'node:path';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { Configuration } from '../../domain/entities/Configuration';
import { SyncManifest } from '../../domain/entities/SyncManifest';
import { Agent } from '../../domain/entities/Agent';
import { AgentTimestamp } from '../../domain/value-objects/AgentTimestamp';
import { MappingRule } from '../../domain/value-objects/MappingRule';
import type { IConfigRepository } from '../../domain/ports/IConfigRepository';

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

export class BunConfigRepository implements IConfigRepository {
	private readonly DOT_AGENTS_FOLDER: string;
	private readonly SYNC_FILE: string;

	constructor({
		dotAgentsFolder = '.agents',
		syncFile = 'state.json',
	}: BunConfigRepositoryProps = {}) {
		this.DOT_AGENTS_FOLDER = dotAgentsFolder;
		this.SYNC_FILE = syncFile;
	}

	public async save(config: Configuration): Promise<void> {
		const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
		const aiPath = join(agentsPath, '.ai');
		const syncPath = join(aiPath, this.SYNC_FILE);

		// Create .agents folder if it doesn't exist
		await mkdir(agentsPath, { recursive: true });

		// Create .agents/.ai folder
		await mkdir(aiPath, { recursive: true });

		// Prepare data to save (Manifest + Agents)
		const data: PersistedConfigData = {
			manifest: config.manifest.toJSON(),
			agents: config.agents.map((agent) => ({
				id: agent.id,
				name: agent.name,
				sourceRoot: agent.sourceRoot,
			inbound: agent.inboundRules.map((r) => ({
				from: r.from,
				to: r.to,
				format: r.format,
				...(r.sourceExt != null && { sourceExt: r.sourceExt }),
				...(r.targetExt != null && { targetExt: r.targetExt }),
			})),
			outbound: agent.outboundRules.map((r) => ({
				from: r.from,
				to: r.to,
				format: r.format,
				...(r.sourceExt != null && { sourceExt: r.sourceExt }),
				...(r.targetExt != null && { targetExt: r.targetExt }),
			})),
			})),
		};

		await writeFile(syncPath, JSON.stringify(data, null, 2));

		// Ensure subfolders rules, skills, mcp exist
		await mkdir(join(aiPath, 'rules'), { recursive: true });
		await mkdir(join(aiPath, 'skills'), { recursive: true });
		await mkdir(join(aiPath, 'mcp'), { recursive: true });
	}

	public async exists(workspaceRoot: string): Promise<boolean> {
		const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);
		try {
			await access(syncPath, constants.F_OK);
			return true;
		} catch {
			return false;
		}
	}

	public async load(workspaceRoot: string): Promise<Configuration> {
		const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);

		try {
			const fileContent = await readFile(syncPath, 'utf8');
			const data = JSON.parse(fileContent) as PersistedConfigData;

			// Reconstruct manifest (filter 'agents' key for backward compatibility)
			const rawAgents = data.manifest?.agents ?? {};
			const manifestAgents = Object.fromEntries(
				Object.entries(rawAgents)
					.filter(([key]) => key !== 'agents')
					.map(([key, val]) => [
						key,
						AgentTimestamp.create(val as { lastProcessedAt: number }),
					])
			);
			const manifest = SyncManifest.create({
				...data.manifest,
				agents: manifestAgents,
			});

			// Reconstruct agents
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
