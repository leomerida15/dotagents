import { MappingRule } from '../../../config/domain/value-objects/MappingRule';
import { SyncAction } from '../entities/SyncAction';

/**
 * Port for the sync interpreter, which converts mapping rules into atomic actions.
 */
export interface ISyncInterpreter {
	/**
	 * Interprets a mapping rule and generates the necessary sync actions.
	 * @param rule The mapping rule to interpret.
	 * @param options Additional context like base paths or format-specific data.
	 */
	interpret(rule: MappingRule, options?: Record<string, any>): Promise<SyncAction[]>;
}
