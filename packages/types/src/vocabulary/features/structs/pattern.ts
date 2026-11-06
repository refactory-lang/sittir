import type { GrammarMap, Slot, Text } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Struct<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.struct';
		readonly fields?: Slot<
			G,
			'pattern.struct',
			'fields',
			| V.Pattern.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>[];
		readonly type?: Slot<
			G,
			'pattern.struct',
			'type',
			| V.Identifier<G>
			| V.Identifier.Qualified<G>
			| V.Identifier.Any<G>
			| V.Type.Generic.Turbofish<G>
			| string
		>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarMap> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by pr
			readonly $kind: 'pattern.struct.field';
			readonly byReference?: Flag;
			readonly mutable?: Flag;
			readonly name: Slot<G, 'pattern.struct.field', 'name', V.Identifier.Any<G>>;
			readonly pattern?: Slot<
				G,
				'pattern.struct.field',
				'pattern',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Type.Primitive<G>
			>;
		}
		// claimed by r
		export type Rest<G extends GrammarMap> = Text<G, 'pattern.struct.rest'>;
	}
}
