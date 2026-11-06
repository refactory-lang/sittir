import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Collection {
		export interface Struct<G extends GrammarMap> extends SubKindOf<V.Expression.Collection<G>> {
			// claimed by r
			readonly $kind: 'expression.collection.struct';
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
