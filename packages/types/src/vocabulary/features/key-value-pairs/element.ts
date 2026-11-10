import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Pair<G extends GrammarMap, K extends Under<'element.pair'> = 'element.pair'> extends SubKindOf<V.Element<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly key: Slot<
			G,
			K,
			'key',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| string
			| V.Declaration.Module<G>
		>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
}
