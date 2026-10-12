import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Call<G extends GrammarContext<G>> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Member<G extends GrammarContext<G>> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Subscript<G extends GrammarContext<G>> {
		readonly optionalChain?: Flag;
		// t only
	}
}
