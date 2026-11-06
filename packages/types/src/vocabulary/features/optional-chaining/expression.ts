import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Expression {
	export interface Call<G extends GrammarMap, K extends Under<'expression.call'> = 'expression.call'> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Member<G extends GrammarMap, K extends Under<'expression.member'> = 'expression.member'> {
		readonly optionalChain?: Flag;
		// t only
	}
	export interface Subscript<G extends GrammarMap, K extends Under<'expression.subscript'> = 'expression.subscript'> {
		readonly optionalChain?: Flag;
		// t only
	}
}
