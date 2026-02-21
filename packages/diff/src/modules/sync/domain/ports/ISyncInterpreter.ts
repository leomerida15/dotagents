import { MappingRule } from '../../../config/domain/value-objects/MappingRule';
import { SyncAction } from '../entities/SyncAction';

import { SyncManifest } from '../../../config/domain/entities/SyncManifest';

export interface SyncOptions {
	sourceRoot: string;
	targetRoot: string;
	manifest?: SyncManifest;
	force?: boolean;
	enableDelete?: boolean;
	affectedPaths?: string[];
}

/**
 * Port for the sync interpreter, which converts mapping rules into atomic actions.
 */
export interface ISyncInterpreter {
	/**
	 * Interprets a mapping rule and generates the necessary sync actions.
	 * @param rule The mapping rule to interpret.
	 * @param options Additional context like base paths, manifest, and flags.
	 */
	interpret(rule: MappingRule, options: SyncOptions): Promise<SyncAction[]>;
}
