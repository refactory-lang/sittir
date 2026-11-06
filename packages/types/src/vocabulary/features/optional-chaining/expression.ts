import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Member<G extends GrammarMap> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Subscript<G extends GrammarMap> {
		readonly optionalChain?: Flag;
		// t only
	}
}
