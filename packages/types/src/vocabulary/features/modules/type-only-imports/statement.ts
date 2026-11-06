import type { GrammarMap } from '../../../map.ts';
import type { Flag } from '../../../utils.ts';
export namespace Statement {
	export interface Export<G extends GrammarMap> {
		readonly typeOnly?: Flag;
		// t only
	}
	export interface Import<G extends GrammarMap> {
		readonly typeOnly?: Flag;
		// t only
	}
}
