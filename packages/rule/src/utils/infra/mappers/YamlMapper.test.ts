import { describe, expect, it } from 'bun:test';
import { YamlMapper } from './YamlMapper';
import { RuleSource } from '../../domain/value-objects/RuleSource';

describe('YamlMapper', () => {
	const source = RuleSource.Local('/tmp/test.yaml');

	it('parses YAML with source_ext and target_ext into domain MappingRule', () => {
		const yamlContent = {
			agent: {
				id: 'test-agent',
				name: 'Test Agent',
				source_root: '.cursor/',
			},
			mapping: {
				inbound: [
					{
						from: 'rules/',
						to: 'rules/',
						format: 'directory',
						source_ext: '.mdc',
						target_ext: '.md',
					},
				],
				outbound: [
					{
						from: 'rules/',
						to: 'rules/',
						format: 'directory',
						source_ext: '.md',
						target_ext: '.mdc',
					},
				],
			},
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.inbound).toHaveLength(1);
		expect(parsed.inbound[0].from).toBe('rules/');
		expect(parsed.inbound[0].to).toBe('rules/');
		expect(parsed.inbound[0].sourceExt).toBe('.mdc');
		expect(parsed.inbound[0].targetExt).toBe('.md');

		expect(parsed.outbound).toHaveLength(1);
		expect(parsed.outbound[0].sourceExt).toBe('.md');
		expect(parsed.outbound[0].targetExt).toBe('.mdc');
	});

	it('parses YAML without source_ext/target_ext (backward compatible)', () => {
		const yamlContent = {
			agent: {
				id: 'legacy-agent',
				name: 'Legacy Agent',
				source_root: './',
			},
			mapping: {
				inbound: [{ from: 'config.json', to: 'mcp/config.json', format: 'json' }],
				outbound: [{ from: 'mcp/config.json', to: 'config.json' }],
			},
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.inbound[0].sourceExt).toBeUndefined();
		expect(parsed.inbound[0].targetExt).toBeUndefined();
	});

	it('supports top-level mapping and source_root (alternative YAML structure)', () => {
		const yamlContent = {
			agent: { id: 'alt-agent', name: 'Alt Agent' },
			source_root: '.test/',
			mapping: {
				inbound: [
					{
						from: 'rules/',
						to: 'rules/',
						format: 'directory',
						source_ext: '.mdc',
						target_ext: '.md',
					},
				],
				outbound: [],
			},
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.sourceRoot).toBe('.test/');
		expect(parsed.inbound[0].sourceExt).toBe('.mdc');
	});

	it('derives sourceRoot from paths with purpose marker', () => {
		const yamlContent = {
			agent: {
				id: 'cursor',
				name: 'Cursor',
				paths: [
					{ path: '.cursor/', scope: 'workspace', type: 'directory', purpose: 'marker' },
					{ path: '.cursor', scope: 'home', type: 'directory', purpose: 'config' },
				],
			},
			mapping: { inbound: [], outbound: [] },
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.sourceRoot).toBe('.cursor/');
		expect(parsed.paths).toHaveLength(2);
	});

	it('derives sourceRoot from paths with purpose sync_source', () => {
		const yamlContent = {
			agent: {
				id: 'custom-agent',
				name: 'Custom',
				paths: [
					{ path: '.agent/', scope: 'workspace', type: 'directory', purpose: 'sync_source' },
				],
			},
			mapping: { inbound: [], outbound: [] },
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.sourceRoot).toBe('.agent/');
	});

	it('falls back to source_root when paths is empty', () => {
		const yamlContent = {
			agent: {
				id: 'fallback-agent',
				name: 'Fallback',
				source_root: '.legacy/',
				paths: [],
			},
			mapping: { inbound: [], outbound: [] },
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.sourceRoot).toBe('.legacy/');
	});

	it('falls back to source_root when paths has no workspace entries', () => {
		const yamlContent = {
			agent: {
				id: 'home-only',
				name: 'Home Only',
				source_root: '.default/',
				paths: [
					{ path: '.config/agent', scope: 'home', type: 'directory', purpose: 'config' },
				],
			},
			mapping: { inbound: [], outbound: [] },
		};

		const parsed = YamlMapper.toDomain(yamlContent, source);

		expect(parsed.sourceRoot).toBe('.default/');
	});
});
