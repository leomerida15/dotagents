import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { ActionType } from '../../domain/value-objects/ActionType';
import {
	MappingFormat,
	type MappingRule,
} from '@diff/modules/config/domain/value-objects/MappingRule';
import { join, isAbsolute, basename, extname } from 'path';
import { readFile, readdir } from 'fs/promises';
import { JSONPath } from 'jsonpath-plus';

/**
 * Metadata provided to a JsonAdapter.
 */
interface JsonAdapterMeta {
	targetPath?: string;
}

/**
 * Adapter function that processes JSON data before sync.
 *
 * @param data The extracted JSON data
 * @param rule The mapping rule defining the transformation
 * @param meta Additional metadata for the transformation
 * @returns The transformed data as a string or record
 */
interface JsonAdapter {
	(data: any, rule: MappingRule, meta?: JsonAdapterMeta): Promise<string | Record<string, any>>;
}

/**
 * Properties for initializing the JsonSyncInterpreter.
 */
export interface JsonSyncInterpreterProps {}

/**
 * Interpreter specialized in JSON transformations and splitting.
 */
export class JsonSyncInterpreter implements ISyncInterpreter {
	private adapters: Map<string, JsonAdapter> = new Map();

	/**
	 * Creates a JSON sync interpreter and registers available adapters.
	 *
	 * @param props - Reserved initialization properties for future options
	 */
	constructor({}: JsonSyncInterpreterProps = {}) {
		this.registerAdapters();
	}

	private registerAdapters() {
		// Adapter: Merges .agents/agents/*.json back into .opencode/opencode.json format.
		// Reads existing target to preserve $schema and mcp sections, then rebuilds agent key.
		this.adapters.set(
			'opencode-config',
			async (data: any, _rule: MappingRule, meta?: { targetPath?: string }) => {
				let existing: Record<string, any> = {};
				if (meta?.targetPath) {
					try {
						const raw = await readFile(meta.targetPath, 'utf-8');
						existing = JSON.parse(raw);
					} catch {
						// target doesn't exist yet — start fresh
					}
				}
				return {
					...(existing['$schema']
						? { $schema: existing['$schema'] }
						: { $schema: 'https://opencode.ai/config.json' }),
					agent: data,
					...(existing['mcp'] ? { mcp: existing['mcp'] } : {}),
				};
			},
		);

		// Adapter: Opencode MCP -> DotAgents Standard MCP (JSON)
		// Transforms command array ["cmd", "arg"] to { command: "cmd", args: ["arg"] }
		this.adapters.set('mcp-standard', async (data: any) => {
			const mcpServers: Record<string, any> = {};

			for (const [key, value] of Object.entries(data)) {
				const config = value as any;
				const serverConfig: Record<string, any> = {};

				if (config.command && Array.isArray(config.command)) {
					const [cmd, ...args] = config.command;
					serverConfig.command = cmd;
					serverConfig.args = args;
				} else if (config.command) {
					serverConfig.command = config.command;
				}

				if (config.env) serverConfig.env = config.env;
				if (config.enabled === false) serverConfig.disabled = true;

				mcpServers[key] = serverConfig;
			}

			return { mcpServers };
		});

		// Adapter: Opencode Agent -> DotAgents Agent Standard (JSON)
		// Simply passes through the JSON object, allowing for future normalization
		this.adapters.set('agent-json', async (data: any) => {
			// data is the agent object { "mode": "all", "description": "...", "prompt": "..." }
			// We return it as-is to be written as a JSON file
			return data;
		});
	}

	/**
	 * Interprets a mapping rule and produces synchronization actions for JSON transformations.
	 * @param rule - The mapping rule to interpret
	 * @param options - Synchronization options containing source and target roots
	 * @returns A promise resolving to the list of synchronization actions
	 */
	async interpret(rule: MappingRule, options: SyncOptions): Promise<SyncAction[]> {
		const { sourceRoot, targetRoot } = options;
		const actions: SyncAction[] = [];

		if (!sourceRoot || !targetRoot) {
			throw new Error('SyncInterpreter requires sourceRoot and targetRoot');
		}

		// Ensure rule.to is treated correctly based on format
		// If json-split, to is a directory. If json-transform, to is a file. If json-merge, from is a directory, to is a file.
		const fullSource = isAbsolute(rule.from) ? rule.from : join(sourceRoot, rule.from);
		const fullTarget = isAbsolute(rule.to) ? rule.to : join(targetRoot, rule.to);

		// JSON_MERGE: read all JSON files from source directory, merge into a single target file
		if (rule.format === MappingFormat.JSON_MERGE) {
			let entries: string[];
			try {
				entries = await readdir(fullSource);
			} catch {
				// Source directory doesn't exist — nothing to merge
				return [];
			}

			const jsonFiles = entries.filter((fileName) => extname(fileName) === '.json');
			if (jsonFiles.length === 0) return [];

			// Build merged object: { agentName: agentContent }
			const merged: Record<string, any> = {};
			for (const file of jsonFiles) {
				const key = basename(file, '.json');
				try {
					const raw = await readFile(join(fullSource, file), 'utf-8');
					merged[key] = JSON.parse(raw);
				} catch {
					console.warn(`json-merge: could not parse ${file}, skipping`);
				}
			}

			let finalContent: any = merged;
			if (rule.adapter) {
				const adapter = this.adapters.get(rule.adapter);
				if (adapter) {
					finalContent = await adapter(merged, rule, { targetPath: fullTarget });
				} else {
					console.warn(`Adapter not found: ${rule.adapter}`);
				}
			}

			actions.push(
				SyncAction.create({
					type: ActionType.WRITE,
					target: fullTarget,
					content: finalContent as Record<string, any>,
				}),
			);
			return actions;
		}

		// 1. Read Source
		let sourceContent;
		try {
			const raw = await readFile(fullSource, 'utf-8');
			sourceContent = JSON.parse(raw);
		} catch (error) {
			console.warn(`Could not read or parse source JSON: ${fullSource}`, error);
			return [];
		}

		// 2. Extract Data
		let extractedData = sourceContent;
		if (rule.extract) {
			// jsonpath-plus typically returns an array of matches.
			// We assume extraction targets a single node (object/array) for transform,
			// or a collection for split.
			const result = JSONPath({ path: rule.extract, json: sourceContent });

			if (!result || result.length === 0) {
				return [];
			}

			// Take the first match as the root for subsequent operations
			extractedData = result[0];
		}

		// 3. Process based on Format
		if (rule.format === MappingFormat.JSON_TRANSFORM) {
			let finalContent = extractedData;

			if (rule.adapter) {
				const adapter = this.adapters.get(rule.adapter);
				if (adapter) {
					// Adapter might return string or object
					finalContent = await adapter(extractedData, rule);
				} else {
					console.warn(`Adapter not found: ${rule.adapter}`);
				}
			}

			actions.push(
				SyncAction.create({
					type: ActionType.WRITE,
					target: fullTarget,
					content: finalContent as string | Record<string, any>,
				}),
			);
		} else if (rule.format === MappingFormat.JSON_SPLIT) {
			// Expect extractedData to be an Object { key: val } to iterate
			if (typeof extractedData !== 'object' || extractedData === null) {
				return [];
			}

			for (const [key, value] of Object.entries(extractedData)) {
				let finalContent = value;

				if (rule.adapter) {
					const adapter = this.adapters.get(rule.adapter);
					if (adapter) {
						finalContent = await adapter(value, rule);
					}
				}

				// Determine filename
				const ext = rule.targetExt || '.json';
				const filename = `${key}${ext}`;
				const targetPath = join(fullTarget, filename);

				actions.push(
					SyncAction.create({
						type: ActionType.WRITE,
						target: targetPath,
						content: finalContent as string | Record<string, any>,
					}),
				);
			}
		}

		return actions;
	}
}
