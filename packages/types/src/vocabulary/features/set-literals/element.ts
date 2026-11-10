import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export namespace Spread {
		export interface Map<G extends GrammarMap, K extends Under<'element.spread.map'> = 'element.spread.map'> extends SubKindOf<V.Element.Spread<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
		export interface Parenthesized<G extends GrammarMap, K extends Under<'element.spread.parenthesized'> = 'element.spread.parenthesized'> extends SubKindOf<V.Element.Spread<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Element.Spread<G> | V.Element.Spread.Parenthesized<G>>;
		}
	}
}
