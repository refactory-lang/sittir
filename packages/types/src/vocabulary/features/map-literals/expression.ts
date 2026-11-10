import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Map<G extends GrammarMap, K extends Under<'expression.collection.map'> = 'expression.collection.map'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly elements?: Slot<G, K, 'elements', V.Element.Any<G>>[];
		}
	}
}
