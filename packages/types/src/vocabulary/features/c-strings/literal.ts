import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface C<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by r
			readonly $kind: 'literal.string.c';
		}
	}
}
