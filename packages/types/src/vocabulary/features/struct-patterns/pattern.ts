import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Struct<G extends GrammarMap, K extends Under<'pattern.struct'> = 'pattern.struct'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pr
		readonly $path: K;
		readonly fields?: Slot<
			G,
			K,
			'fields',
			| V.Pattern.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>[];
		readonly type?: Slot<
			G,
			K,
			'type',
			| V.Identifier<G>
			| V.Identifier.Qualified<G>
			| V.Identifier.Any<G>
			| V.Type.Generic.Turbofish<G>
			| string
		>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarMap, K extends Under<'pattern.struct.field'> = 'pattern.struct.field'> extends SubKindOf<V.Pattern.Struct<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly byReference?: Flag;
			readonly mutable?: Flag;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
			readonly pattern?: Slot<
				G,
				K,
				'pattern',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
				| V.Type.Primitive<G>
			>;
		}
	}
}
