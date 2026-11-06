import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarMap, K extends Under<'expression.collection.tuple'> = 'expression.collection.tuple'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly elements?: Slot<
				G,
				K,
				'elements',
				| V.Element.Spread<G>
				| V.Element.Spread.Parenthesized<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Statement.Any<G>
				| V.Type.Primitive<G>
			>[];
		}
		export namespace Tuple {
			export interface Bare<G extends GrammarMap, K extends Under<'expression.collection.tuple.bare'> = 'expression.collection.tuple.bare'> extends SubKindOf<V.Expression.Collection.Tuple<G, K>> {
				// claimed by p
				readonly $path: K;
				readonly trailingComma?: Flag;
			}
		}
	}
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'expression.unit'>;
}
