import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarMap, K extends Under<'expression.collection.tuple'> = 'expression.collection.tuple'> extends SubKindOf<V.Expression<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly elements?: Slot<G, K, 'elements', V.Expression.AnyWithSpread<G>>[];
		}
	}
}
