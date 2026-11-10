import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Template<G extends GrammarMap, K extends Under<'expression.call.template'> = 'expression.call.template'> extends SubKindOf<V.Expression.Call<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly arguments: Slot<G, K, 'arguments', V.Literal.String.Interpolated<G>>;
			readonly function: Slot<
				G,
				K,
				'function',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
