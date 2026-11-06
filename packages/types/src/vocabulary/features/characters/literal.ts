import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Character<G extends GrammarMap> extends SubKindOf<V.Literal<G>> {
		// claimed by r
		readonly $kind: 'literal.character';
		readonly byte?: Flag;
		readonly content?: Slot<G, 'literal.character', 'content', string>;
	}
}
