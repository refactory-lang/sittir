import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Import<G extends GrammarContext> extends SubKindOf<V.Expression.Call<G>> {
			readonly $kind: 'expression.call.import';
		}
	}
}
