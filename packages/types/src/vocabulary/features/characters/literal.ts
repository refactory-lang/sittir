import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Char<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.char';
		readonly byte?: Flag;
		readonly content?: G['slots']['literal.char']['content'];
	}
}
