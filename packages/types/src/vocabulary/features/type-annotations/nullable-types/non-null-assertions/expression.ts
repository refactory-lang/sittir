import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Expression {
	export namespace Cast {
		export interface NonNull<G extends GrammarMap, K extends Under<'expression.cast.non_null'> = 'expression.cast.non_null'> extends SubKindOf<V.Expression.Cast<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
