import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { WORKSPACE_KNOWN_AGENTS, getWorkspaceMarker } from '../domain/WorkspaceAgents';

/**
 * Creates the workspace-local sync root for an agent when missing (e.g. `.cursor/` when the user
 * only had `~/.cursor`), so inbound/outbound sync targets the project, not the home directory.
 *
 * @param workspaceRoot - Absolute workspace folder path
 * @param agentId - Agent identifier
 * @param sourceRootHint - Optional `sourceRoot` from config or rule YAML (relative path preferred)
 */
export async function ensureWorkspaceSyncRootExists(
	workspaceRoot: string,
	agentId: string,
	sourceRootHint?: string,
): Promise<void> {
	const known = WORKSPACE_KNOWN_AGENTS.find((a) => a.id === agentId);
	let rel = (sourceRootHint ?? '').replace(/\/$/, '').trim();
	if (!rel && known) {
		rel = getWorkspaceMarker(known);
	}
	if (!rel) {
		rel = `.${agentId}`;
	}
	if (rel.includes('..')) {
		return;
	}
	if (rel.startsWith('/') || /^[A-Za-z]:[\\/]/.test(rel)) {
		// If config persisted an absolute (home) path, still create the workspace-local marker
		// for known agents so sync roots in the project (e.g. `.cursor/`).
		if (known) {
			rel = getWorkspaceMarker(known);
		} else {
			return;
		}
	}
	const root = resolve(workspaceRoot);
	const abs = resolve(root, rel);
	const prefix = root.endsWith(sep) ? root : root + sep;
	if (abs !== root && !abs.startsWith(prefix)) {
		return;
	}
	if (!existsSync(abs)) {
		await mkdir(abs, { recursive: true });
	}
}
