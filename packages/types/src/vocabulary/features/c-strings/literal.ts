import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface C<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by r
			readonly $kind: 'literal.string.c';
		}
		export namespace C {
			export interface Raw<G extends GrammarMap> extends SubKindOf<V.Literal.String.C<G>> {
				// claimed by r
				readonly $kind: 'literal.string.c.raw';
				readonly content: Slot<G, 'literal.string.c.raw', 'content', V.Literal.String.Text<G>>;
				// r only
			}
		}
	}
}
