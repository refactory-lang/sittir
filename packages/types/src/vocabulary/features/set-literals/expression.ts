import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Set<G extends GrammarMap, K extends Under<'expression.collection.set'> = 'expression.collection.set'> extends SubKindOf<V.Expression<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly elements: Slot<G, K, 'elements', V.Expression.AnyWithSpread<G>>[];
		}
	}
}
