import type { GrammarContext } from '../../../../context.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Expression {
	export namespace Cast {
		export interface NonNull<G extends GrammarContext> extends SubKindOf<V.Expression.Cast<G>> {
			readonly $kind: 'expression.cast.non_null';
			readonly expression: G['slots']['expression.cast.non_null']['expression'];
		}
	}
}
