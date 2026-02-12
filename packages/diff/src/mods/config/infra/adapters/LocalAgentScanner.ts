import { Agent } from '../../domain/entities/Agent';
import type { IAgentScanner } from '../../domain/ports/IAgentScanner';
import { readdir } from 'node:fs/promises';

interface LocalAgentScannerProps {
    agentMarkers?: Record<string, { name: string; marker: string }>;
}

export class LocalAgentScanner implements IAgentScanner {
    // Common directory markers for AI agents as defined in base.md
    private readonly AGENT_MARKERS: Record<string, { name: string; marker: string }>;

    constructor({ agentMarkers }: LocalAgentScannerProps = {}) {
        this.AGENT_MARKERS = agentMarkers ?? {
            cursor: { name: 'Cursor', marker: '.cursor' },
            antigravity: { name: 'Antigravity', marker: '.agent' },
            cline: { name: 'Cline', marker: '.cline' },
            claude: { name: 'Claude Code', marker: '.claude' },
            kilocode: { name: 'Kilo Code', marker: '.kilocode' },
            opencode: { name: 'OpenCode', marker: '.agents' },
        };
    }

    /**
     * Scans the workspace root for known agent directory markers.
     */
    public async detectAgents(workspaceRoot: string): Promise<Agent[]> {
        const agents: Agent[] = [];

        try {
            const entries = await readdir(workspaceRoot, { withFileTypes: true });
            const dirNames = entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            for (const [id, metadata] of Object.entries(this.AGENT_MARKERS)) {
                if (dirNames.includes(metadata.marker)) {
                    // In a real scenario, we would populate mapping rules from GitHub via RuleProvider
                    // For the scanner, we just identify that the agent exists locally.
                    agents.push(
                        Agent.create({
                            id,
                            name: metadata.name,
                            sourceRoot: metadata.marker,
                            inbound: [], // These will be populated by the application layer/RuleProvider
                            outbound: []
                        })
                    );
                }
            }
        } catch (error) {
            console.error(`Error scanning for agents in ${workspaceRoot}:`, error);
        }

        return agents;
    }
}
