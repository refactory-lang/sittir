import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface C<G extends GrammarMap, K extends Under<'literal.string.c'> = 'literal.string.c'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by r
			readonly $kind: K;
		}
		export namespace C {
			export interface Raw<G extends GrammarMap, K extends Under<'literal.string.c.raw'> = 'literal.string.c.raw'> extends SubKindOf<V.Literal.String.C<G, K>> {
				// claimed by r
				readonly $kind: K;
				readonly content: Slot<G, 'literal.string.c.raw', 'content', V.Literal.String.Text<G>>;
				// r only
			}
		}
	}
}
