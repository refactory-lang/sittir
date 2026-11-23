import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Function<G extends GrammarMap, K extends Under<'expression.function'> = 'expression.function'> {
	}
	export namespace Yield {
		export interface Delegate<G extends GrammarMap, K extends Under<'expression.yield.delegate'> = 'expression.yield.delegate'> extends SubKindOf<V.Expression.Yield<G, K>, 'expression'> {
			// claimed by pt
			readonly $path: K;
			readonly expression: Slot<G, K, 'expression', V.Expression.Any<G>>;
		}
	}
}
