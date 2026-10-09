import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Reference<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.reference';
	}
	export namespace Unary {
		export interface Deref<G extends GrammarContext> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.deref';
			readonly operator: '*';
		}
	}
}
