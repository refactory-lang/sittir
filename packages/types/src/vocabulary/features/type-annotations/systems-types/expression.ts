import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Cast {
		export interface Conversion<G extends GrammarMap, K extends Under<'expression.cast.conversion'> = 'expression.cast.conversion'> extends SubKindOf<V.Expression.Cast<G, K>, 'expression'> {
			// claimed by r
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
			readonly type: Slot<
				G,
				K,
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
