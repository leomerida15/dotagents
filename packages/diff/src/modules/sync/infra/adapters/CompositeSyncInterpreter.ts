import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { MappingRule, MappingFormat } from '@diff/modules/config/domain/value-objects/MappingRule';

export interface CompositeSyncInterpreterProps {
	defaultInterpreter: ISyncInterpreter;
	jsonInterpreter: ISyncInterpreter;
}

/**
 * Composite interpreter that delegates rule interpretation to a specific strategy
 * based on the rule's format. Defaults to standard interpretation for non-JSON rules.
 */
export class CompositeSyncInterpreter implements ISyncInterpreter {
	private defaultInterpreter: ISyncInterpreter;
	private jsonInterpreter: ISyncInterpreter;

	/**
	 * Creates a CompositeSyncInterpreter with the provided interpreters.
	 * @param props - The properties containing default and JSON interpreters
	 */
	constructor({ defaultInterpreter, jsonInterpreter }: CompositeSyncInterpreterProps) {
		this.defaultInterpreter = defaultInterpreter;
		this.jsonInterpreter = jsonInterpreter;
	}

	/**
	 * Interprets a mapping rule and produces an array of synchronization actions
	 * by delegating to the appropriate specialized interpreter.
	 *
	 * @param rule The mapping rule to interpret
	 * @param options Synchronization options like directions
	 * @returns A promise resolving to the list of synchronization actions
	 */
	async interpret(rule: MappingRule, options: SyncOptions): Promise<SyncAction[]> {
		if (
			rule.format === MappingFormat.JSON_TRANSFORM ||
			rule.format === MappingFormat.JSON_SPLIT ||
			rule.format === MappingFormat.JSON_MERGE
		) {
			return this.jsonInterpreter.interpret(rule, options);
		}
		return this.defaultInterpreter.interpret(rule, options);
	}
}
