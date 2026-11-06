import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Struct<G extends GrammarMap, K extends Under<'element.struct'> = 'element.struct'> extends SubKindOf<V.Element<G, K>> {
		readonly $path: K;
	}
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
		export interface Field<G extends GrammarMap, K extends Under<'element.struct.field'> = 'element.struct.field'> extends SubKindOf<V.Element.Struct<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly field:
				Slot<
				G,
				K,
				'field',
				| V.Identifier.Any<G>
				| V.Literal.Number.Integer<G>
				| V.Literal.Number.Integer.Binary<G>
				| V.Literal.Number.Integer.Hex<G>
				| V.Literal.Number.Integer.Octal<G>
			>;
			readonly value?: Slot<
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
