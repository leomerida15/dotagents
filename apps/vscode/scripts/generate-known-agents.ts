/**
 * Build-time script: reads <REPO_ROOT>/rules/*.yaml and generates WorkspaceAgents.generated.ts
 * with WORKSPACE_KNOWN_AGENTS. Run from apps/vscode (cwd = apps/vscode).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';

/**
 * Describes a path entry declared in a rule YAML file.
 */
interface PathEntry {
	path: string;
	scope?: 'workspace' | 'home';
	type?: 'file' | 'directory';
	purpose?: 'marker' | 'sync_source' | 'config';
}

/**
 * Partial YAML schema consumed by the known-agents generator.
 */
interface YamlSchema {
	agent?: { id?: string; name?: string; source_root?: string; paths?: PathEntry[] };
	source_root?: string;
	paths?: PathEntry[];
}

const REPO_ROOT = join(process.cwd(), '..', '..');
/** Build-time only: read from repo root rules, not .agents/rules */
const RULES_DIR = join(REPO_ROOT, 'rules');
const OUT_PATH = join(
	process.cwd(),
	'src',
	'modules',
	'orchestrator',
	'domain',
	'WorkspaceAgents.generated.ts',
);

/**
 * Derives the workspace marker directory from the provided paths or source root.
 *
 * @param paths The list of path entries associated with the agent
 * @param sourceRoot The default source root directory
 * @returns The resolved workspace marker path
 */
function deriveWorkspaceMarker(paths: PathEntry[] | undefined, sourceRoot: string): string {
	if (paths != null && paths.length > 0) {
		const workspacePaths = paths.filter((pathEntry) => pathEntry.scope === 'workspace');
		const markerOrSync = workspacePaths.find(
			(pathEntry) => pathEntry.purpose === 'marker' || pathEntry.purpose === 'sync_source',
		);
		if (markerOrSync) return markerOrSync.path.replace(/\/$/, '');
		const first = workspacePaths[0];
		if (first) return first.path.replace(/\/$/, '');
	}
	return sourceRoot.replace(/\/$/, '');
}

/**
 * Derives the configuration file path from the provided paths or source root.
 *
 * @param paths The list of path entries associated with the agent
 * @param sourceRoot The default source root directory
 * @returns The resolved configuration file path
 */
function deriveConfigPath(paths: PathEntry[] | undefined, sourceRoot: string): string {
	if (paths != null && paths.length > 0) {
		const homeConfig = paths.find(
			(pathEntry) => pathEntry.scope === 'home' && pathEntry.purpose === 'config',
		);
		if (homeConfig) return homeConfig.path;
	}
	return sourceRoot.replace(/\/$/, '');
}

/**
 * Converts a PathEntry object into a stringified object literal.
 *
 * @param pathEntry The path entry object to stringify
 * @returns The stringified representation of the path entry
 */
function pathEntryToLiteral(pathEntry: PathEntry): string {
	const parts = [
		`path: ${JSON.stringify(pathEntry.path)}`,
		pathEntry.scope != null ? `scope: ${JSON.stringify(pathEntry.scope)}` : null,
		pathEntry.type != null ? `type: ${JSON.stringify(pathEntry.type)}` : null,
		pathEntry.purpose != null ? `purpose: ${JSON.stringify(pathEntry.purpose)}` : null,
	].filter(Boolean);
	return `{ ${parts.join(', ')} }`;
}

/**
 * Converts a known agent object into a stringified object literal.
 *
 * @param agent The agent object containing id, configPath, workspaceMarker, and paths
 * @returns The stringified representation of the known agent
 */
function knownAgentToLiteral(agent: {
	id: string;
	configPath: string;
	workspaceMarker: string;
	paths?: PathEntry[];
}): string {
	const pathsLiteral =
		agent.paths != null && agent.paths.length > 0
			? `paths: [\n      ${agent.paths.map((pathEntry) => pathEntryToLiteral(pathEntry)).join(',\n      ')},\n    ]`
			: '';
	return `  {
    id: ${JSON.stringify(agent.id)},
    configPath: ${JSON.stringify(agent.configPath)},
    workspaceMarker: ${JSON.stringify(agent.workspaceMarker)},
${pathsLiteral ? `    ${pathsLiteral},\n` : ''}  }`;
}

/**
 * Main execution function.
 * Reads rule YAML files from the workspace root and generates a TypeScript
 * file containing the list of known agents and their configurations.
 *
 * @returns A promise that resolves when the generation is complete
 */
async function main(): Promise<void> {
	let entries: { name: string }[] = [];
	try {
		const dirEntries = await readdir(RULES_DIR, { withFileTypes: true });
		entries = dirEntries
			.filter((e) => e.isFile() && e.name.endsWith('.yaml'))
			.map((e) => ({ name: e.name }));
	} catch {
		console.warn(
			`No rules directory found at ${RULES_DIR}. Generating empty known agents list.`,
		);
	}

	const knownAgents: Array<{
		id: string;
		configPath: string;
		workspaceMarker: string;
		paths?: PathEntry[];
	}> = [];

	for (const { name } of entries) {
		const filePath = join(RULES_DIR, name);
		let content: string;
		try {
			content = await readFile(filePath, 'utf-8');
		} catch (err) {
			console.error('Failed to read:', filePath, err);
			process.exit(1);
		}
		let parsed: unknown;
		try {
			parsed = yaml.load(content);
		} catch (err) {
			console.error('Invalid YAML:', filePath, err);
			process.exit(1);
		}
		if (parsed == null || typeof parsed !== 'object') {
			console.error('Empty or invalid YAML:', filePath);
			process.exit(1);
		}
		const schema = parsed as YamlSchema;
		const agent = schema.agent;
		const id = agent?.id ?? (schema as { agent?: { id?: string } }).agent?.id;
		if (!id || typeof id !== 'string') {
			console.error('Invalid YAML: Missing agent.id in', filePath);
			process.exit(1);
		}
		const paths = agent?.paths ?? schema.paths;
		const sourceRootFromPaths =
			paths != null && paths.length > 0
				? (() => {
						const workspacePaths = paths.filter(
							(pathEntry) => pathEntry.scope === 'workspace',
						);
						const markerOrSync = workspacePaths.find(
							(pathEntry) =>
								pathEntry.purpose === 'marker' ||
								pathEntry.purpose === 'sync_source',
						);
						return (markerOrSync ?? workspacePaths[0])?.path;
					})()
				: null;
		const sourceRoot = sourceRootFromPaths ?? agent?.source_root ?? schema.source_root ?? '.';
		const workspaceMarker = deriveWorkspaceMarker(paths, sourceRoot);
		const configPath = deriveConfigPath(paths, sourceRoot);
		knownAgents.push({
			id,
			configPath,
			workspaceMarker,
			paths: paths ?? undefined,
		});
	}

	knownAgents.sort((a, b) => a.id.localeCompare(b.id));

	const lines = [
		'// Generated by scripts/generate-known-agents.ts — do not edit by hand',
		'',
		'export const WORKSPACE_KNOWN_AGENTS = [',
		knownAgents.map((a) => knownAgentToLiteral(a)).join(',\n'),
		'];',
		'',
	];
	await writeFile(OUT_PATH, lines.join('\n'), 'utf-8');
	console.log('Generated', OUT_PATH, 'with', knownAgents.length, 'agents');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
