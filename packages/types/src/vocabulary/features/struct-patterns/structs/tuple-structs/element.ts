import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Element {
	export namespace Struct {
		export interface Base<G extends GrammarMap, K extends Under<'element.struct.base'> = 'element.struct.base'> extends SubKindOf<V.Element.Struct<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly value: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
}
