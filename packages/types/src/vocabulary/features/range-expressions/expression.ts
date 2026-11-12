import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Range<G extends GrammarMap, K extends Under<'expression.range'> = 'expression.range'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly end?: Slot<
			G,
			K,
			'end',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly start?: Slot<
			G,
			K,
			'start',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarMap, K extends Under<'expression.range.exclusive'> = 'expression.range.exclusive'> extends SubKindOf<V.Expression.Range<G, K>> {
			// claimed by r
			readonly $path: K;
		}
		export interface Inclusive<G extends GrammarMap, K extends Under<'expression.range.inclusive'> = 'expression.range.inclusive'> extends SubKindOf<V.Expression.Range<G, K>> {
			// claimed by r
			readonly $path: K;
		}
		export namespace Inclusive {
			export interface Legacy<G extends GrammarMap, K extends Under<'expression.range.inclusive.legacy'> = 'expression.range.inclusive.legacy'> extends SubKindOf<V.Expression.Range.Inclusive<G, K>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
}
