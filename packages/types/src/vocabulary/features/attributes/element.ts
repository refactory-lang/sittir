import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Attributed<G extends GrammarMap, K extends Under<'element.attributed'> = 'element.attributed'> extends SubKindOf<V.Element<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly attributes: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		readonly value: Slot<
			G,
			K,
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
			| V.Type.Primitive<G>
		>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarMap, K extends Under<'element.struct.field'> = 'element.struct.field'> {
			readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
		}
	}
}
