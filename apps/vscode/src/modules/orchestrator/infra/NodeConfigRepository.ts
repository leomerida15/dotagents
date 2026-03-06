import { join } from 'node:path';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
// @ts-ignore: Suppress module resolution error if types are missing
import {
	Agent,
	AgentTimestamp,
	Configuration,
	type IConfigRepository,
	MappingRule,
	SyncManifest,
} from '@dotagents/diff';

/**
 * Options to configure the NodeConfigRepository.
 */
interface NodeConfigRepositoryProps {
	dotAgentsFolder?: string;
	syncFile?: string;
}

/**
 * Data structure for the persisted configuration state.
 */
interface PersistedConfigData {
	/** Serialized sync manifest state. */
	manifest: any;
	/** Serialized agents configuration with inbound/outbound mappings. */
	agents: any[];
}

/**
 * Node.js implementation of IConfigRepository for the VSCode extension.
 * Persists configuration to .agents/.ai/state.json.
 */
export class NodeConfigRepository implements IConfigRepository {
	private readonly DOT_AGENTS_FOLDER: string;
	private readonly SYNC_FILE: string;

	/**
	 * Creates a Node repository for reading and persisting sync state.
	 *
	 * @param props - Optional configuration for folder and state file names
	 */
	constructor({
		dotAgentsFolder = '.agents',
		syncFile = 'state.json',
	}: NodeConfigRepositoryProps = {}) {
		this.DOT_AGENTS_FOLDER = dotAgentsFolder;
		this.SYNC_FILE = syncFile;
	}

	/**
	 * Retrieves the main synchronization file path.
	 *
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns The absolute path to the current sync state file.
	 */
	private getSyncPath(workspaceRoot: string): string {
		return join(workspaceRoot, this.DOT_AGENTS_FOLDER, '.ai', this.SYNC_FILE);
	}

	/**
	 * Retrieves the legacy synchronization file path.
	 *
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns The absolute path to the legacy sync state file.
	 */
	private getLegacySyncPath(workspaceRoot: string): string {
		return join(workspaceRoot, this.DOT_AGENTS_FOLDER, this.SYNC_FILE);
	}

	/**
	 * Migrates the state file from its legacy location to the new structured location.
	 *
	 * @param workspaceRoot - The root directory of the workspace.
	 * @param fileContent - The content of the legacy file to preserve.
	 */
	private async migrateLegacyState(workspaceRoot: string, fileContent: string): Promise<void> {
		const agentsPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER);
		const aiPath = join(agentsPath, '.ai');
		const syncPath = this.getSyncPath(workspaceRoot);
		const legacyPath = this.getLegacySyncPath(workspaceRoot);

		await mkdir(aiPath, { recursive: true });
		await writeFile(syncPath, fileContent);
		await unlink(legacyPath).catch(() => undefined);
	}

	/**
	 * Saves the configuration to the workspace.
	 * @param config - The configuration object to save.
	 */
	public async save(config: Configuration): Promise<void> {
		const agentsPath = join(config.workspaceRoot, this.DOT_AGENTS_FOLDER);
		const aiPath = join(agentsPath, '.ai');
		const syncPath = join(aiPath, this.SYNC_FILE);
		const legacyPath = join(agentsPath, this.SYNC_FILE);

		await mkdir(agentsPath, { recursive: true });

		// Create .agents/.ai for internal state storage
		await mkdir(aiPath, { recursive: true });

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
		await unlink(legacyPath).catch(() => undefined);

		await mkdir(join(agentsPath, '.ai', 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'skills'), { recursive: true });
		await mkdir(join(agentsPath, 'mcp'), { recursive: true });
	}

	/**
	 * Loads the configuration from the workspace.
	 * @param workspaceRoot - The root directory of the workspace.
	 * @returns The loaded configuration object.
	 */
	public async load(workspaceRoot: string): Promise<Configuration> {
		const syncPath = this.getSyncPath(workspaceRoot);
		const legacyPath = this.getLegacySyncPath(workspaceRoot);
		let fileContent: string;
		let usedLegacy = false;
		try {
			fileContent = await readFile(syncPath, 'utf8');
		} catch (error) {
			try {
				fileContent = await readFile(legacyPath, 'utf8');
				usedLegacy = true;
			} catch (legacyError) {
				throw new Error(`Could not load configuration from ${syncPath}: ${error}`);
			}
		}
		try {
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
					inbound: (agentProps.inbound || []).map((rule: any) =>
						MappingRule.create(rule),
					),
					outbound: (agentProps.outbound || []).map((rule: any) =>
						MappingRule.create(rule),
					),
				});
			});

			const configuration = Configuration.create({
				workspaceRoot,
				agents,
				manifest,
			});
			if (usedLegacy) {
				await this.migrateLegacyState(workspaceRoot, fileContent);
			}
			return configuration;
		} catch (error) {
			// Instead of throwing immediately, verify if file exists. If not found, return null or throw specific error?
			// The interface implies returning Configuration.
			// InitializeProjectUseCase will use load? No, it uses save.
			// But StartSync uses load.
			throw new Error(`Could not load configuration from ${syncPath}: ${error}`);
		}
	}

	/**
	 * Ensures .agents/.ai structure exists (for projects already initialized).
	 * Call before sync when .agents exists but .ai may not.
	 */
	public async ensureAIStructure(workspaceRoot: string): Promise<void> {
		const agentsPath = join(workspaceRoot, this.DOT_AGENTS_FOLDER);
		await mkdir(join(agentsPath, '.ai'), { recursive: true });
		await mkdir(join(agentsPath, '.ai', 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'rules'), { recursive: true });
		await mkdir(join(agentsPath, 'skills'), { recursive: true });
		await mkdir(join(agentsPath, 'mcp'), { recursive: true });
	}

	/**
	 * Checks if the configuration exists.
	 */
	public async exists(workspaceRoot: string): Promise<boolean> {
		const syncPath = this.getSyncPath(workspaceRoot);
		const legacyPath = this.getLegacySyncPath(workspaceRoot);
		try {
			await readFile(syncPath);
			return true;
		} catch {
			try {
				await readFile(legacyPath);
				return true;
			} catch {
				return false;
			}
		}
	}
}
