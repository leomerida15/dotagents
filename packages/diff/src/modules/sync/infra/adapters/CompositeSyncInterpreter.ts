import type { ISyncInterpreter, SyncOptions } from '../../domain/ports/ISyncInterpreter';
import { SyncAction } from '../../domain/entities/SyncAction';
import { MappingRule, MappingFormat } from '@diff/modules/config/domain/value-objects/MappingRule';

export class CompositeSyncInterpreter implements ISyncInterpreter {
	private defaultInterpreter: ISyncInterpreter;
	private jsonInterpreter: ISyncInterpreter;

	constructor(defaultInterpreter: ISyncInterpreter, jsonInterpreter: ISyncInterpreter) {
		this.defaultInterpreter = defaultInterpreter;
		this.jsonInterpreter = jsonInterpreter;
	}

	async interpret(rule: MappingRule, options: SyncOptions): Promise<SyncAction[]> {
		if (
			rule.format === MappingFormat.JSON_TRANSFORM ||
			rule.format === MappingFormat.JSON_SPLIT
		) {
			return this.jsonInterpreter.interpret(rule, options);
		}
		return this.defaultInterpreter.interpret(rule, options);
	}
}
