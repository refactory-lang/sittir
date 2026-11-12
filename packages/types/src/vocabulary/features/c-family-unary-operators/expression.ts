import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Unary {
		export interface BitwiseNot<G extends GrammarMap, K extends Under<'expression.unary.bitwise_not'> = 'expression.unary.bitwise_not'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
		export interface Plus<G extends GrammarMap, K extends Under<'expression.unary.plus'> = 'expression.unary.plus'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
	}
}
