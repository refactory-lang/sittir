import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarMap> {
		readonly move?: Flag;
		// r only
	}
	export interface Reference<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.reference';
		readonly argument: Slot<
			G,
			'expression.reference',
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
		export interface Deref<G extends GrammarMap> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.deref';
		}
	}
}
