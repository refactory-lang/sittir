import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Subscript<G extends GrammarContext<G>> {
		readonly optionalChain?: Flag;
		// t only
	}
}
