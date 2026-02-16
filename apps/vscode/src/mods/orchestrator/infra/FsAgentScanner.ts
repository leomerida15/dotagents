import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { Agent, IAgentScanner } from '@dotagents/diff';

export class FsAgentScanner implements IAgentScanner {
    async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        // Simple implementation:
        // 1. Scan for packages/apps folders
        // 2. If it has a package.json, consider it a potential agent source?
        // OR: For now, we can just return a default agent if found, or empty.
        // Let's implement a dummy scanner that returns the VSCode app itself as an agent if found, or scan `apps/` and `packages/`.

        const agents: Agent[] = [];

        // This logic is highly specific to the project structure.
        // For this sprint, we might just want to return an empty list or detected "known" agents.
        // Let's try to scan `apps` and `packages` dirs.

        const dirsToScan = ['apps', 'packages'];

        for (const dir of dirsToScan) {
            const scanPath = join(workspaceRoot, dir);
            try {
                const entries = await readdir(scanPath);
                for (const entry of entries) {
                    const fullPath = join(scanPath, entry);
                    if ((await stat(fullPath)).isDirectory()) {
                        // Assume it's an agent for now
                        const agentId = entry; // e.g. "vscode", "diff"

                        // We don't know rules yet, because rules come from the Provider (downloaded from centralized repo)
                        // OR defined locally.
                        // InitializeProjectUseCase: "Scan project for agents that match master rules"
                        // So usually Scanner lists potential agents (paths), and logic matches them with Rules.
                        // But `detectAgents` returns `Agent[]` which includes Rules.
                        // Actually InitializeProjectUseCase logic:
                        // 1. Fetch masterRules (Agent definitions).
                        // 2. Detect agents.

                        // Wait, looking at InitializeProjectUseCase.ts:
                        // "const detectedAgents = await this.agentScanner.detectAgents(workspaceRoot);"
                        // It doesn't pass masterRules to detectAgents.
                        // So Scanner is responsible for finding Agents AND their rules?
                        // If so, where does it get rules?

                        // If we look at `InitializeProjectUseCase.ts`:
                        // "masterRules = await this.ruleProvider.fetchAgentDefinitions();"
                        // It fetches them but doesn't use `masterRules`. Unused variable?

                        // Let's assume Scanner should find valid Agents.
                        // For the integration test, we might just want a dummy "demo-agent".

                        agents.push(Agent.create({
                            id: agentId,
                            name: agentId,
                            sourceRoot: join(dir, entry),
                            inbound: [], // No rules by default
                            outbound: []
                        }));
                    }
                }
            } catch (e) {
                // Ignore if dir doesn't exist
            }
        }

        return agents;
    }
}
