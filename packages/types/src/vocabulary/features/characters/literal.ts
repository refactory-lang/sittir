import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Character<G extends GrammarContext<G>> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.character';
		readonly byte?: Flag;
		readonly content?: G['slots']['literal.character']['content'];
	}
}
