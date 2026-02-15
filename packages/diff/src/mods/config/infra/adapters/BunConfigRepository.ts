import { join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { Configuration } from '../../domain/entities/Configuration';
import { SyncManifest } from '../../domain/entities/SyncManifest';
import { Agent } from '../../domain/entities/Agent';
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
		syncFile = 'sync.json',
	}: BunConfigRepositoryProps = {}) {
		this.DOT_AGENTS_FOLDER = dotAgentsFolder;
		this.SYNC_FILE = syncFile;
	}

	public async save(config: Configuration): Promise<void> {
		const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
		const syncPath = join(agentsPath, this.SYNC_FILE);

		// Create .agents folder if it doesn't exist
		await mkdir(agentsPath, { recursive: true });

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
				})),
				outbound: agent.outboundRules.map((r) => ({
					from: r.from,
					to: r.to,
					format: r.format,
				})),
			})),
		};

		await writeFile(syncPath, JSON.stringify(data, null, 2));

		// Ensure subfolders rules, skills, mcp exist
		await mkdir(join(agentsPath, 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'skills'), { recursive: true });
		await mkdir(join(agentsPath, 'mcp'), { recursive: true });
	}

	public async load(workspaceRoot: string): Promise<Configuration> {
		const syncPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER, this.SYNC_FILE);

		try {
			const fileContent = await readFile(syncPath, 'utf8');
			const data = JSON.parse(fileContent) as PersistedConfigData;

			// Reconstruct manifest
			const manifest = SyncManifest.create(data.manifest);

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
