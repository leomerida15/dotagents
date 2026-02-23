import type { PathEntry } from '@dotagents/rule';
import { WORKSPACE_KNOWN_AGENTS as generated } from './WorkspaceAgents.generated';

/**
 * Single source of truth for known agents: workspace marker dir and (optional) home config path.
 */
export interface KnownAgent {
	id: string;
	configPath: string;
	workspaceMarker: string;
	paths?: PathEntry[];
}

export function getWorkspaceMarker(agent: KnownAgent): string {
	let raw: string;
	if (agent.paths != null && agent.paths.length > 0) {
		const workspacePaths = agent.paths.filter((p) => p.scope === 'workspace');
		const markerOrSyncSource = workspacePaths.find(
			(p) => p.purpose === 'marker' || p.purpose === 'sync_source',
		);
		if (markerOrSyncSource) raw = markerOrSyncSource.path;
		else {
			const first = workspacePaths[0];
			raw = first ? first.path : agent.workspaceMarker;
		}
	} else raw = agent.workspaceMarker;
	// Normalize: strip trailing slash for dir name comparison (e.g. readdir returns ".cursor")
	return raw.replace(/\/$/, '');
}

export function getConfigPath(agent: KnownAgent): string {
	if (agent.paths != null && agent.paths.length > 0) {
		const configPath = agent.paths.find(
			(p) => p.scope === 'home' && p.purpose === 'config',
		);
		if (configPath) return configPath.path;
	}
	return agent.configPath;
}

export function getSyncSourcePaths(agent: KnownAgent): PathEntry[] {
	if (agent.paths == null || agent.paths.length === 0) return [];
	return agent.paths.filter(
		(p) =>
			p.scope === 'workspace' &&
			(p.purpose === 'marker' || p.purpose === 'sync_source'),
	);
}

export const WORKSPACE_KNOWN_AGENTS: KnownAgent[] = generated;

/** For migration and sync: list of { id, dir } where dir is the workspace folder name. */
export const WORKSPACE_AGENT_MARKERS: { id: string; dir: string }[] = WORKSPACE_KNOWN_AGENTS.map(
	(a) => ({ id: a.id, dir: getWorkspaceMarker(a) }),
);
