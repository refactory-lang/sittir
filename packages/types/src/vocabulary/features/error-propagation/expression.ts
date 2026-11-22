import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Propagate<G extends GrammarMap, K extends Under<'expression.propagate'> = 'expression.propagate'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly argument: Slot<G, K, 'argument', V.Expression.Any<G>>;
	}
}
