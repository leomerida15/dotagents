import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { YamlConfigRepository } from '../infrastructure/yaml-config-repository';
import { createProjectConfig } from '../domain/project-config.entity';
import { createAgentId } from '../domain/agent-id.vo';
import { createConfigPath } from '../domain/config-path.vo';
import { createProjectPath } from '../domain/project-path.vo';
import { rmSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';

const TEST_CONFIG_PATH = '/tmp/dotagents-test/config.yaml';
const TEST_DIR = '/tmp/dotagents-test';

describe('YamlConfigRepository', () => {
	let repository: YamlConfigRepository;

	beforeEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
		mkdirSync(TEST_DIR, { recursive: true });
		repository = new YamlConfigRepository();
	});

	afterEach(() => {
		if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
	});

	describe('Happy Path', () => {
		it('load returns ProjectConfig with correct data', async () => {
			const configContent = `activeAgent: cursor
agents:
  - cursor
  - claude
projectPath: /test/project
lastModified: '2024-01-01T00:00:00.000Z'
`;
			writeFileSync(TEST_CONFIG_PATH, configContent);

			const result = await repository.load(createConfigPath(TEST_CONFIG_PATH));

			expect(result.activeAgent).toBe(createAgentId('cursor'));
			expect(result.agents).toHaveLength(2);
			expect(result.agents).toContain(createAgentId('cursor'));
			expect(result.agents).toContain(createAgentId('claude'));
		});

		it('save writes valid YAML to file', async () => {
			const config = createProjectConfig({
				projectPath: createProjectPath('/my/project'),
				activeAgent: createAgentId('cursor'),
				agents: [createAgentId('cursor'), createAgentId('claude')],
			});

			await repository.save(config, createConfigPath(TEST_CONFIG_PATH));

			expect(existsSync(TEST_CONFIG_PATH)).toBe(true);
			const written = await Bun.file(TEST_CONFIG_PATH).text();
			expect(written).toContain('activeAgent: cursor');
			expect(written).toContain('- cursor');
			expect(written).toContain('- claude');
		});

		it('exists returns true when file exists', async () => {
			writeFileSync(TEST_CONFIG_PATH, 'activeAgent: cursor\n');

			const result = await repository.exists(createConfigPath(TEST_CONFIG_PATH));

			expect(result).toBe(true);
		});

		it('loading config twice returns the same data (idempotent)', async () => {
			const configContent = `activeAgent: cursor
agents:
  - cursor
projectPath: /test/project
`;
			writeFileSync(TEST_CONFIG_PATH, configContent);

			const first = await repository.load(createConfigPath(TEST_CONFIG_PATH));
			const second = await repository.load(createConfigPath(TEST_CONFIG_PATH));

			expect(first.activeAgent).toBe(second.activeAgent);
			expect(first.agents).toEqual(second.agents);
		});
	});

	describe('Edge Cases', () => {
		it('exists returns false when file does not exist', async () => {
			const result = await repository.exists(createConfigPath('/nonexistent/path.yaml'));

			expect(result).toBe(false);
		});

		it('throws descriptive error for invalid YAML', async () => {
			writeFileSync(TEST_CONFIG_PATH, 'invalid: yaml: content: [');

			await expect(repository.load(createConfigPath(TEST_CONFIG_PATH))).rejects.toThrow();
		});

		it('config with multiple agents preserves all agents', async () => {
			const config = createProjectConfig({
				projectPath: createProjectPath('/my/project'),
				activeAgent: createAgentId('cursor'),
				agents: [
					createAgentId('cursor'),
					createAgentId('claude'),
					createAgentId('copilot'),
					createAgentId('gemini'),
				],
			});

			await repository.save(config, createConfigPath(TEST_CONFIG_PATH));
			const loaded = await repository.load(createConfigPath(TEST_CONFIG_PATH));

			expect(loaded.agents).toHaveLength(4);
			expect(loaded.agents).toContain(createAgentId('cursor'));
			expect(loaded.agents).toContain(createAgentId('claude'));
			expect(loaded.agents).toContain(createAgentId('copilot'));
			expect(loaded.agents).toContain(createAgentId('gemini'));
		});
	});

	describe('Negative Path', () => {
		it('throws error when saving to read-only directory', async () => {
			const readonlyDir = '/tmp/dotagents-readonly';
			mkdirSync(readonlyDir, { recursive: true });
			chmodSync(readonlyDir, 0o444);

			const config = createProjectConfig({
				projectPath: createProjectPath('/my/project'),
				activeAgent: createAgentId('cursor'),
			});

			try {
				await expect(
					repository.save(config, createConfigPath(`${readonlyDir}/config.yaml`)),
				).rejects.toThrow();
			} finally {
				chmodSync(readonlyDir, 0o755);
				rmSync(readonlyDir, { recursive: true });
			}
		});

		it('throws validation error for empty config path', () => {
			expect(() => createConfigPath('')).toThrow('Config path cannot be empty');
		});
	});
});
