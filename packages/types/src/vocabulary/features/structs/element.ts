import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Element {
	export interface Struct<G extends GrammarMap> extends SubKindOf<V.Element<G>> {
		readonly $kind: 'element.struct';
	}
	export namespace Struct {
		export interface Base<G extends GrammarMap> extends SubKindOf<V.Element.Struct<G>> {
			// claimed by r
			readonly $kind: 'element.struct.base';
			readonly value: Slot<
				G,
				'element.struct.base',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
		export interface Field<G extends GrammarMap> extends SubKindOf<V.Element.Struct<G>> {
			// claimed by r
			readonly $kind: 'element.struct.field';
			readonly field:
				Slot<
				G,
				'element.struct.field',
				'field',
				| V.Identifier.Any<G>
				| V.Literal.Number.Integer<G>
				| V.Literal.Number.Integer.Binary<G>
				| V.Literal.Number.Integer.Hex<G>
				| V.Literal.Number.Integer.Octal<G>
			>;
			readonly value?: Slot<
				G,
				'element.struct.field',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>;
		}
	}
}
