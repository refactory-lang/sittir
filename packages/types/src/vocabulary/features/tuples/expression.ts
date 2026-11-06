import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Tuple<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by pr
			readonly $kind: 'expression.collection.tuple';
			readonly elements?: Slot<
				G,
				'expression.collection.tuple',
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
			export interface Bare<G extends GrammarMap> extends SubKindOf<V.Expression.Collection.Tuple<G>> {
				// claimed by p
				readonly $kind: 'expression.collection.tuple.bare';
				readonly trailingComma?: Flag;
			}
		}
	}
	// claimed by r
	export type Unit<G extends GrammarMap> = Text<G, 'expression.unit'>;
}
