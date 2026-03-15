import { mkdirSync, existsSync } from 'node:fs';
import type { IPreferencesRepository } from '../domain/preferences-repository.port';
import type { CliPreferences } from '../domain/cli-preferences.entity';
import { createCliPreferences } from '../domain/cli-preferences.entity';
import { createAgentId, isAgentId } from '../domain/agent-id.vo';

/**
 * JSON-based implementation of the CLI preferences repository.
 * Uses Bun's file API for reading and writing JSON preferences.
 */
export class JsonPreferencesRepository implements IPreferencesRepository {
	private readonly filePath: string;

	/**
	 * Creates a new JsonPreferencesRepository.
	 * @param props - The repository properties
	 * @param props.filePath - The path to the preferences JSON file
	 */
	constructor({ filePath }: { filePath: string }) {
		this.filePath = filePath;
	}

	/**
	 * Loads the CLI preferences from the JSON file.
	 * @returns The loaded CliPreferences, or default preferences if file doesn't exist
	 * @throws Error if the file exists but cannot be parsed
	 */
	async load(): Promise<CliPreferences> {
		const file = Bun.file(this.filePath);
		const exists = await file.exists();

		if (!exists) {
			return createCliPreferences();
		}

		let content: string;
		try {
			content = await file.text();
		} catch {
			return createCliPreferences();
		}

		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(content);
		} catch {
			throw new Error('Failed to parse preferences');
		}

		if (!parsed || typeof parsed !== 'object') {
			return createCliPreferences();
		}

		const rawDefaultAgent = parsed.defaultAgent as string | undefined;
		const defaultAgent =
			rawDefaultAgent && isAgentId(rawDefaultAgent)
				? createAgentId(rawDefaultAgent)
				: undefined;

		return createCliPreferences({
			verbose: parsed.verbose as boolean | undefined,
			daemonLogPath: parsed.daemonLogPath as string | undefined,
			defaultAgent,
		});
	}

	/**
	 * Saves the CLI preferences to the JSON file.
	 * Creates the parent directory if it doesn't exist.
	 * @param preferences - The preferences to save
	 * @throws Error if the file cannot be written
	 */
	async save(preferences: CliPreferences): Promise<void> {
		const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
		if (dir && !existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		const file = Bun.file(this.filePath);
		const jsonContent = JSON.stringify(
			{
				verbose: preferences.verbose,
				daemonLogPath: preferences.daemonLogPath,
				defaultAgent: preferences.defaultAgent,
			},
			null,
			2,
		);

		await file.write(jsonContent);
	}

	/**
	 * Checks if the preferences file exists.
	 * @returns true if the file exists
	 */
	async exists(): Promise<boolean> {
		const file = Bun.file(this.filePath);
		return await file.exists();
	}
}
