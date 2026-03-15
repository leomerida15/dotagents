import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { loadProjectConfig } from '../application/load-project-config.use-case';
import { saveProjectConfig } from '../application/save-project-config.use-case';
import { getActiveAgent } from '../application/get-active-agent.use-case';
import { YamlConfigRepository } from '../infrastructure/yaml-config-repository';
import { JsonPreferencesRepository } from '../infrastructure/json-preferences-repository';
import { createProjectConfig } from '../domain/project-config.entity';
import { createCliPreferences } from '../domain/cli-preferences.entity';
import { createAgentId } from '../domain/agent-id.vo';
import { createConfigPath } from '../domain/config-path.vo';
import { createProjectPath } from '../domain/project-path.vo';
import { rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const TEST_DIR = '/tmp/dotagents-use-case-test';
const TEST_CONFIG_PATH = `${TEST_DIR}/config.yaml`;
const TEST_PREFS_PATH = '/tmp/dotagents-use-case-test/preferences.json';

describe('LoadProjectConfig Use Case', () => {
	let configRepository: YamlConfigRepository;
	let preferencesRepository: JsonPreferencesRepository;

	beforeEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
		mkdirSync(TEST_DIR, { recursive: true });
		configRepository = new YamlConfigRepository();
		preferencesRepository = new JsonPreferencesRepository({ filePath: TEST_PREFS_PATH });
	});

	afterEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	});

	describe('Happy Path', () => {
		it('loads config from valid project path and returns ProjectConfig', async () => {
			const projectPath = createProjectPath('/test/project');
			const config = createProjectConfig({
				projectPath,
				activeAgent: createAgentId('cursor'),
				agents: [createAgentId('cursor'), createAgentId('claude')],
			});
			await configRepository.save(config, createConfigPath(TEST_CONFIG_PATH));

			const result = await loadProjectConfig({
				configRepository,
				projectPath,
				configPath: createConfigPath(TEST_CONFIG_PATH),
			});

			expect(result).not.toBeNull();
			expect(result!.activeAgent).toBe(createAgentId('cursor'));
			expect(result!.agents).toHaveLength(2);
		});
	});

	describe('Edge Cases', () => {
		it('returns null when no config file exists', async () => {
			const projectPath = createProjectPath('/test/project');

			const result = await loadProjectConfig({
				configRepository,
				projectPath,
			});

			expect(result).toBeNull();
		});

		it('throws descriptive error when config file is invalid', async () => {
			const projectPath = createProjectPath('/test/project');
			writeFileSync(TEST_CONFIG_PATH, 'invalid: yaml: content: [');

			await expect(
				loadProjectConfig({
					configRepository,
					projectPath,
					configPath: createConfigPath(TEST_CONFIG_PATH),
				}),
			).rejects.toThrow();
		});
	});
});

describe('SaveProjectConfig Use Case', () => {
	let configRepository: YamlConfigRepository;

	beforeEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
		mkdirSync(TEST_DIR, { recursive: true });
		configRepository = new YamlConfigRepository();
	});

	afterEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	});

	describe('Happy Path', () => {
		it('saves valid config and writes to file', async () => {
			const config = createProjectConfig({
				projectPath: createProjectPath('/test/project'),
				activeAgent: createAgentId('claude'),
				agents: [createAgentId('claude'), createAgentId('cursor')],
			});

			await saveProjectConfig({
				configRepository,
				config,
				configPath: createConfigPath(TEST_CONFIG_PATH),
			});

			const loaded = await configRepository.load(createConfigPath(TEST_CONFIG_PATH));
			expect(loaded.activeAgent).toBe(createAgentId('claude'));
			expect(loaded.agents).toHaveLength(2);
		});
	});

	describe('Edge Cases', () => {
		it('creates directory when it does not exist', async () => {
			const deepDir = '/tmp/dotagents-new/nested/dir';
			if (existsSync(deepDir)) rmSync(deepDir, { recursive: true });

			const config = createProjectConfig({
				projectPath: createProjectPath('/test/project'),
				activeAgent: createAgentId('cursor'),
			});
			const deepConfigPath = `${deepDir}/config.yaml`;

			await saveProjectConfig({
				configRepository,
				config,
				configPath: createConfigPath(deepConfigPath),
			});

			expect(existsSync(deepDir)).toBe(true);
			expect(existsSync(deepConfigPath)).toBe(true);

			if (existsSync('/tmp/dotagents-new')) rmSync('/tmp/dotagents-new', { recursive: true });
		});
	});

	describe('Negative Path', () => {
		it('throws error for invalid config', async () => {
			const invalidConfig = null as unknown as ReturnType<typeof createProjectConfig>;

			await expect(
				saveProjectConfig({
					configRepository,
					config: invalidConfig,
				}),
			).rejects.toThrow();
		});
	});
});

describe('GetActiveAgent Use Case', () => {
	let configRepository: YamlConfigRepository;
	let preferencesRepository: JsonPreferencesRepository;

	beforeEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
		mkdirSync(TEST_DIR, { recursive: true });
		configRepository = new YamlConfigRepository();
		preferencesRepository = new JsonPreferencesRepository({ filePath: TEST_PREFS_PATH });
	});

	afterEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	});

	describe('Happy Path', () => {
		it('returns active agent ID when config exists', async () => {
			const projectPath = createProjectPath('/test/project');
			const projectConfig = createProjectConfig({
				projectPath,
				activeAgent: createAgentId('cursor'),
			});
			await configRepository.save(projectConfig, createConfigPath(TEST_CONFIG_PATH));

			const result = await getActiveAgent({
				configRepository,
				preferencesRepository,
				projectPath,
				configPath: createConfigPath(TEST_CONFIG_PATH),
			});

			expect(result).toBe(createAgentId('cursor'));
		});
	});

	describe('Edge Cases', () => {
		it('falls back to CLI default agent when no project config exists', async () => {
			const projectPath = createProjectPath('/test/project');
			const defaultAgent = createAgentId('claude');
			const prefs = createCliPreferences({ defaultAgent });
			await preferencesRepository.save(prefs);

			const result = await getActiveAgent({
				configRepository,
				preferencesRepository,
				projectPath,
			});

			expect(result).toBe(defaultAgent);
		});

		it('throws error when no config and no default in CLI prefs', async () => {
			const projectPath = createProjectPath('/test/project');
			const prefs = createCliPreferences({ verbose: false });
			await preferencesRepository.save(prefs);

			await expect(
				getActiveAgent({
					configRepository,
					preferencesRepository,
					projectPath,
				}),
			).rejects.toThrow('No active agent found and no default agent configured');
		});
	});
});
