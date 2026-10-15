import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.struct';
		readonly fields?: V.Pattern.Struct.Any<G>[];
		readonly type?: V.Identifier.Type<G> | V.Type.Path<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by r
			readonly $kind: 'pattern.struct.field';
			readonly byReference?: Flag;
			readonly mutable?: Flag;
			readonly name: G['identifier'];
			readonly pattern?: G['slots']['pattern.struct.field']['pattern'];
		}
		export interface Rest<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by r
			readonly $kind: 'pattern.struct.rest';
		}
	}
	export namespace Tuple {
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Tuple<G>> {
			// claimed by r
			readonly $kind: 'pattern.tuple.struct';
			readonly patterns?: G['slots']['pattern.tuple.struct']['patterns'][];
			readonly type: G['slots']['pattern.tuple.struct']['type'];
		}
	}
}
