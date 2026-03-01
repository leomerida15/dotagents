import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { ActionType } from '../../domain/value-objects/ActionType';
import { MappingRule, MappingFormat } from '@diff/modules/config/domain/value-objects/MappingRule';
import { join, isAbsolute } from 'path';
import { readFile } from 'fs/promises';
import { JSONPath } from 'jsonpath-plus';

interface JsonAdapter {
	(data: any, rule: MappingRule): Promise<string | Record<string, any>>;
}

/**
 * Interpreter specialized in JSON transformations and splitting.
 */
export class JsonSyncInterpreter implements ISyncInterpreter {
	private adapters: Map<string, JsonAdapter> = new Map();

	constructor() {
		this.registerAdapters();
	}

	private registerAdapters() {
		// Adapter: Opencode MCP -> DotAgents Standard MCP (JSON)
		// Transforms command array ["cmd", "arg"] to { command: "cmd", args: ["arg"] }
		this.adapters.set('mcp-standard', async (data: any) => {
			const mcpServers: Record<string, any> = {};

			for (const [key, val] of Object.entries(data)) {
				const config = val as any;
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

	async interpret(rule: MappingRule, options: SyncOptions): Promise<SyncAction[]> {
		const { sourceRoot, targetRoot } = options;
		const actions: SyncAction[] = [];

		if (!sourceRoot || !targetRoot) {
			throw new Error('SyncInterpreter requires sourceRoot and targetRoot');
		}

		// Ensure rule.to is treated correctly based on format
		// If json-split, to is a directory. If json-transform, to is a file.
		const fullSource = isAbsolute(rule.from) ? rule.from : join(sourceRoot, rule.from);
		const fullTarget = isAbsolute(rule.to) ? rule.to : join(targetRoot, rule.to);

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

			for (const [key, val] of Object.entries(extractedData)) {
				let finalContent = val;

				if (rule.adapter) {
					const adapter = this.adapters.get(rule.adapter);
					if (adapter) {
						finalContent = await adapter(val, rule);
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
