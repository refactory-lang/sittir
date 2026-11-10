import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Statement {
	export interface Resource<G extends GrammarMap, K extends Under<'statement.resource'> = 'statement.resource'> {
		readonly async?: Flag;
	}
}
