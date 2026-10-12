import type { GrammarContext } from '../../../../context.ts';
import type { Flag } from '../../../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly definite?: Flag;
		// t only
	}
	export interface Variable<G extends GrammarContext<G>> {
		readonly definite?: Flag;
		// t only
	}
}
