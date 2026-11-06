import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Character<G extends GrammarMap, K extends Under<'literal.character'> = 'literal.character'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly byte?: Flag;
		readonly content?: Slot<G, K, 'content', string>;
	}
}
