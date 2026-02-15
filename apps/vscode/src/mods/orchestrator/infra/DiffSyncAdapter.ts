import { IDiffSyncEngine } from '../app/ports/IDiffSyncEngine';
import { SyncProjectUseCase } from '@diff/mods/sync/app/use-cases/SyncProjectUseCase';
import { DefaultSyncInterpreter } from '@diff/mods/sync/infra/adapters/DefaultSyncInterpreter';
import { NodeFileSystem } from './NodeFileSystem';
import { ClientModule } from '@rule/mods/client';
import { join } from 'node:path';

/**
 * Adapter that integrates @dotagents/diff and @dotagents/rule
 * to perform synchronization within the VSCode extension.
 */
export class DiffSyncAdapter implements IDiffSyncEngine {
    private syncProject: SyncProjectUseCase;
    private fileSystem: NodeFileSystem;

    constructor() {
        this.fileSystem = new NodeFileSystem();
        this.syncProject = new SyncProjectUseCase({
            interpreter: new DefaultSyncInterpreter(),
            fileSystem: this.fileSystem,
        });
    }

    async syncAll(workspaceRoot: string): Promise<void> {
        // 1. Get all installed rules using @dotagents/rule
        const listRules = ClientModule.createListInstalledRulesUseCase(
            join(workspaceRoot, '.agents', '.ai'),
        );
        const rules = await listRules.execute();

        // 2. Execute sync for each agent
        for (const rule of rules) {
            // Inbound sync: Agent Folder -> .agents Bridge
            // Using the mapping rules defined in the rule DTO
            await this.syncProject.execute({
                rules: rule.mappings.inbound,
                sourcePath: join(workspaceRoot, rule.sourceRoot),
                targetPath: join(workspaceRoot, '.agents', rule.id),
            });

            // We could also do outbound here if needed,
            // but for Sprint 1 we focus on the base sync flow.
        }
    }
}
