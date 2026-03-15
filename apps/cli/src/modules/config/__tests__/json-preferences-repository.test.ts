import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { JsonPreferencesRepository } from '../infrastructure/json-preferences-repository';
import { createCliPreferences } from '../domain/cli-preferences.entity';
import { rmSync, existsSync, readFileSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';

const TEST_PREFS_PATH = '/tmp/dotagents-test/preferences.json';
const TEST_DIR = '/tmp/dotagents-test';

describe('JsonPreferencesRepository', () => {
	let repository: JsonPreferencesRepository;

	beforeEach(() => {
		try {
			if (existsSync(TEST_DIR)) {
				chmodSync(TEST_DIR, 0o755);
				rmSync(TEST_DIR, { recursive: true });
			}
		} catch {
			// ignore cleanup errors
		}
		repository = new JsonPreferencesRepository({ filePath: TEST_PREFS_PATH });
	});

	afterEach(() => {
		try {
			if (existsSync(TEST_DIR)) {
				chmodSync(TEST_DIR, 0o755);
				rmSync(TEST_DIR, { recursive: true });
			}
		} catch {
			// ignore cleanup errors
		}
	});

	describe('Happy Path', () => {
		it('load() returns CliPreferences with default values when file does not exist', async () => {
			const prefs = await repository.load();
			expect(prefs.verbose).toBe(false);
			expect(prefs.defaultAgent).toBeUndefined();
			expect(prefs.daemonLogPath).toBeUndefined();
		});

		it('save() writes valid JSON to file', async () => {
			const prefs = createCliPreferences({ verbose: true });
			await repository.save(prefs);

			expect(existsSync(TEST_PREFS_PATH)).toBe(true);
			const content = JSON.parse(readFileSync(TEST_PREFS_PATH, 'utf-8'));
			expect(content.verbose).toBe(true);
		});

		it('exists() returns true when preferences file exists', async () => {
			const prefs = createCliPreferences({ verbose: true });
			await repository.save(prefs);

			const result = await repository.exists();
			expect(result).toBe(true);
		});

		it('save and load returns equivalent preferences (round-trip)', async () => {
			const original = createCliPreferences({
				verbose: true,
				daemonLogPath: '/var/log/daemon',
			});
			await repository.save(original);

			const loaded = await repository.load();
			expect(loaded.verbose).toBe(original.verbose);
			expect(loaded.daemonLogPath).toBe(original.daemonLogPath);
		});
	});

	describe('Edge Cases', () => {
		it('file does not exist - exists() returns false', async () => {
			const result = await repository.exists();
			expect(result).toBe(false);
		});

		it('corrupted JSON in file throws descriptive error', async () => {
			mkdirSync(TEST_DIR, { recursive: true });
			writeFileSync(TEST_PREFS_PATH, '{ invalid json }');

			await expect(repository.load()).rejects.toThrow('Failed to parse preferences');
		});

		it('partial preferences (only verbose) uses defaults for other fields', async () => {
			mkdirSync(TEST_DIR, { recursive: true });
			writeFileSync(TEST_PREFS_PATH, JSON.stringify({ verbose: true }));

			const prefs = await repository.load();
			expect(prefs.verbose).toBe(true);
			expect(prefs.defaultAgent).toBeUndefined();
			expect(prefs.daemonLogPath).toBeUndefined();
		});
	});

	describe('Negative Path', () => {
		it('save to read-only location throws error', async () => {
			mkdirSync(TEST_DIR, { recursive: true });
			writeFileSync(TEST_PREFS_PATH, '{}');
			chmodSync(TEST_PREFS_PATH, 0o444);
			chmodSync(TEST_DIR, 0o444);

			const prefs = createCliPreferences({ verbose: true });
			await expect(repository.save(prefs)).rejects.toThrow();
		});

		it('save to non-existent directory creates directory automatically', async () => {
			expect(existsSync(TEST_DIR)).toBe(false);

			const prefs = createCliPreferences({ verbose: true });
			await repository.save(prefs);

			expect(existsSync(TEST_DIR)).toBe(true);
			expect(existsSync(TEST_PREFS_PATH)).toBe(true);
		});
	});
});
