/**
 * Single source of truth for known agents: workspace marker dir and (optional) home config path.
 */
export interface KnownAgent {
	id: string;
	configPath: string;
	workspaceMarker: string;
}

export const WORKSPACE_KNOWN_AGENTS: KnownAgent[] = [
	{ id: 'antigravity', configPath: '.gemini/antigravity', workspaceMarker: '.agent' },
	{ id: 'cursor', configPath: '.cursor', workspaceMarker: '.cursor' },
	{ id: 'claude-code', configPath: '.claude', workspaceMarker: '.claude' },
	{ id: 'cline', configPath: '.cline', workspaceMarker: '.cline' },
	{ id: 'windsurf', configPath: '.codeium/windsurf', workspaceMarker: '.windsurf' },
	{ id: 'openclaw', configPath: '.moltbot', workspaceMarker: '.moltbot' },
	{ id: 'opencode', configPath: '.config/opencode', workspaceMarker: '.opencode' },
];

/** For migration and sync: list of { id, dir } where dir is the workspace folder name. */
export const WORKSPACE_AGENT_MARKERS: { id: string; dir: string }[] = WORKSPACE_KNOWN_AGENTS.map(
	(a) => ({ id: a.id, dir: a.workspaceMarker }),
);
