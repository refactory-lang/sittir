import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap, K extends Under<'expression.lambda'> = 'expression.lambda'> {
		readonly move?: Flag;
		// r only
	}
	export interface Reference<G extends GrammarMap, K extends Under<'expression.reference'> = 'expression.reference'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly argument: Slot<
			G,
			K,
			'argument',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly exclusive?: Flag;
		readonly raw?: Flag;
		readonly writable?: Flag;
	}
	export namespace Unary {
		export interface Deref<G extends GrammarMap, K extends Under<'expression.unary.deref'> = 'expression.unary.deref'> extends SubKindOf<V.Expression.Unary<G, K>> {
			readonly $path: K;
		}
	}
}
