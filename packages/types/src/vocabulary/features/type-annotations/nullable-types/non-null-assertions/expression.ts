import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Expression {
	export namespace Cast {
		export interface NonNull<G extends GrammarMap> extends SubKindOf<V.Expression.Cast<G>, 'expression'> {
			// claimed by t
			readonly $kind: 'expression.cast.non_null';
			readonly expression: Slot<
				G,
				'expression.cast.non_null',
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
