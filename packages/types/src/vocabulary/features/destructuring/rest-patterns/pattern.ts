import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Pattern {
	export interface Rest<G extends GrammarMap, K extends Under<'pattern.rest'> = 'pattern.rest'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly pattern: Slot<
			G,
			K,
			'pattern',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Null.Undefined<G>
			| V.Pattern.Any<G>
			| string
		>;
	}
}
