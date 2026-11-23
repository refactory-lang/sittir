import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Spread<G extends GrammarMap, K extends Under<'element.spread'> = 'element.spread'> extends SubKindOf<V.Element<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly expression?: Slot<G, K, 'expression', V.Expression.Any<G>>;
	}
}
