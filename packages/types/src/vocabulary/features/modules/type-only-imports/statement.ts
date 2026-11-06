import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Statement {
	export interface Export<G extends GrammarMap, K extends Under<'statement.export'> = 'statement.export'> {
		readonly typeOnly?: Flag;
		// t only
	}
	export interface Import<G extends GrammarMap, K extends Under<'statement.import'> = 'statement.import'> {
		readonly typeOnly?: Flag;
		// t only
	}
}
