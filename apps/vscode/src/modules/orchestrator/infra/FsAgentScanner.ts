import { join } from 'node:path';
import { homedir } from 'node:os';
import { stat, readFile, readdir } from 'node:fs/promises';
import { Agent, IAgentScanner } from '@dotagents/diff';
import { WORKSPACE_KNOWN_AGENTS } from '../domain/WorkspaceAgents';

interface UserAgentConfig {
    include?: string[];
    exclude?: string[];
}

export class FsAgentScanner implements IAgentScanner {
    private readonly homeDir: string;

    constructor(homeDir?: string) {
        this.homeDir = homeDir || homedir();
    }

    async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        const agentsMap = new Map<string, Agent>();

        // 1. Scan workspace for agent markers (priority: workspace-relative sourceRoot)
        try {
            const entries = await readdir(workspaceRoot, { withFileTypes: true });
            const dirNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);
            for (const known of WORKSPACE_KNOWN_AGENTS) {
                if (dirNames.includes(known.workspaceMarker)) {
                    agentsMap.set(known.id, Agent.create({
                        id: known.id,
                        name: known.id,
                        sourceRoot: known.workspaceMarker,
                        inbound: [],
                        outbound: []
                    }));
                }
            }
        } catch {
            // Ignore if workspace not readable
        }

        // 2. Detect installed agents in home (fallback if not in workspace)
        for (const known of WORKSPACE_KNOWN_AGENTS) {
            if (agentsMap.has(known.id)) continue; // Prefer workspace over home
            const fullPath = join(this.homeDir, known.configPath);
            try {
                if ((await stat(fullPath)).isDirectory()) {
                    agentsMap.set(known.id, Agent.create({
                        id: known.id,
                        name: known.id,
                        sourceRoot: fullPath,
                        inbound: [],
                        outbound: []
                    }));
                }
            } catch {
                // Ignore missing directories
            }
        }

        // 3. Read User Config (Option A/C)
        const configPath = join(workspaceRoot, '.agents', 'config.json');
        let userConfig: UserAgentConfig = {};
        try {
            const content = await readFile(configPath, 'utf-8');
            userConfig = JSON.parse(content);
        } catch {
            // Ignore missing or invalid config
        }

        // 4. Apply Exclusions
        if (userConfig.exclude) {
            for (const excludedId of userConfig.exclude) {
                agentsMap.delete(excludedId);
            }
        }

        // 5. Apply Inclusions (Custom or Forced)
        if (userConfig.include) {
            for (const includedId of userConfig.include) {
                // If it's a known agent not detected, strictly we can't add it without sourceRoot.
                // But if the user forces it, maybe they have it in a non-standard location?
                // For MVP, we only support forcing KNOWN agents to be re-checked or just skipping if not found.
                // Actually, "include" usually means "add even if not detected" but we need a path.
                // Let's assume for now "include" is for agents that ARE detected but maybe were excluded,
                // OR to support custom agents if we allowed specifying paths in config (which we don't yet).
                // Re-reading plan: "Permitir al usuario forzar o excluir".
                // If I force "cursor", I expect it to work.
                // Implementation detail: If "include" lists a known agent, we assume standard path if not found?
                // Or maybe simple logic: Just ensure if it WAS excluded, it's back?
                // No, "include" might be for "I want this enabled".
                // Let's keep it simple: "include" ensures it is present IF we can find a path.
                // If we already detected it, it's there.
                // If we didn't detect it, checking known array:

                if (!agentsMap.has(includedId)) {
                    const known = WORKSPACE_KNOWN_AGENTS.find(a => a.id === includedId);
                    if (known) {
                        const fullPath = join(this.homeDir, known.configPath);
                        // Double check existence? Or trust user?
                        // Better to trust user but maybe warn if path missing.
                        // For now, let's try to add it with standard path.
                        agentsMap.set(known.id, Agent.create({
                            id: known.id,
                            name: known.id,
                            sourceRoot: fullPath,
                            inbound: [],
                            outbound: []
                        }));
                    }
                }
            }
        }

        return Array.from(agentsMap.values());
    }
}
