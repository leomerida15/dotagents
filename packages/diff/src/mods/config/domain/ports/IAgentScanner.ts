import { Agent } from '../entities/Agent';

/**
 * Port interface for scanning the filesystem and detecting supported agents.
 */
export interface IAgentScanner {
    /**
     * Scans a directory for supported AI agent configurations.
     * @param path - The directory path to scan.
     * @returns A list of detected agents.
     */
    detectAgents(path: string): Promise<Agent[]>;
}
