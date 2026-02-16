import { join } from 'node:path';
import { homedir } from 'node:os';
import { stat, readFile } from 'node:fs/promises';
import { Agent, IAgentScanner } from '@dotagents/diff';

interface UserAgentConfig {
    include?: string[];
    exclude?: string[];
}

interface KnownAgent {
    id: string;
    configPath: string; // Relative to home dir
}

const KNOWN_AGENTS: KnownAgent[] = [
    { id: 'antigravity', configPath: '.gemini/antigravity' },
    { id: 'cursor', configPath: '.cursor' },
    { id: 'claude-code', configPath: '.claude' },
    { id: 'cline', configPath: '.cline' },
    { id: 'windsurf', configPath: '.codeium/windsurf' },
    { id: 'openclaw', configPath: '.moltbot' },
    { id: 'opencode', configPath: '.config/opencode' }
];

export class FsAgentScanner implements IAgentScanner {
    private readonly homeDir: string;

    constructor(homeDir?: string) {
        this.homeDir = homeDir || homedir();
    }

    async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        const detectedAgents: Agent[] = [];
        const agentsMap = new Map<string, Agent>();

        // 1. Detect Installed Agents (Option B)
        for (const known of KNOWN_AGENTS) {
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

        // 2. Read User Config (Option A/C)
        const configPath = join(workspaceRoot, '.agents', 'config.json');
        let userConfig: UserAgentConfig = {};
        try {
            const content = await readFile(configPath, 'utf-8');
            userConfig = JSON.parse(content);
        } catch {
            // Ignore missing or invalid config
        }

        // 3. Apply Exclusions
        if (userConfig.exclude) {
            for (const excludedId of userConfig.exclude) {
                agentsMap.delete(excludedId);
            }
        }

        // 4. Apply Inclusions (Custom or Forced)
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
                    const known = KNOWN_AGENTS.find(a => a.id === includedId);
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
