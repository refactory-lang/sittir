import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Range<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.range';
		readonly end?: Slot<
			G,
			'expression.range',
			'end',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly start?: Slot<
			G,
			'expression.range',
			'start',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarMap> extends SubKindOf<V.Expression.Range<G>> {
			// claimed by r
			readonly $kind: 'expression.range.exclusive';
		}
		export interface Inclusive<G extends GrammarMap> extends SubKindOf<V.Expression.Range<G>> {
			// claimed by r
			readonly $kind: 'expression.range.inclusive';
		}
		export namespace Inclusive {
			export interface Legacy<G extends GrammarMap> extends SubKindOf<V.Expression.Range.Inclusive<G>> {
				// claimed by r
				readonly $kind: 'expression.range.inclusive.legacy';
			}
		}
	}
}
