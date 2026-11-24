import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Conditional<G extends GrammarMap, K extends Under<'expression.conditional'> = 'expression.conditional'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly alternative: Slot<G, K, 'alternative', V.Expression.Any<G>>;
		readonly condition: Slot<G, K, 'condition', V.Expression.Any<G>>;
		readonly consequence: Slot<G, K, 'consequence', V.Expression.Any<G>>;
	}
}
