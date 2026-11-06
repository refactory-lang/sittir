import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Struct<G extends GrammarMap, K extends Under<'expression.collection.struct'> = 'expression.collection.struct'> extends SubKindOf<V.Expression.Collection<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body: (V.Element.Struct.Base<G> | V.Element.Struct.Field<G>)[];
			readonly name: Slot<
				G,
				'expression.collection.struct',
				'name',
				| V.Identifier<G>
				| V.Type.Any<G>
				| V.Identifier.Any<G>
			>;
		}
	}
}
