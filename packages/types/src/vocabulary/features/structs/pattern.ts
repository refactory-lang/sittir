import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		readonly $kind: 'pattern.struct';
		readonly fields?: V.Pattern.Struct.Any<G>[];
		readonly type?: V.Identifier.Type<G> | V.Type.Path<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Struct<G>> {
			readonly $kind: 'pattern.struct.field';
		}
		export interface Rest<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Struct<G>> {
			readonly $kind: 'pattern.struct.rest';
		}
	}
	export namespace Tuple {
		export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Tuple<G>> {
			readonly $kind: 'pattern.tuple.struct';
			readonly patterns?: G['slots']['pattern.tuple.struct']['patterns'][];
			readonly type: G['slots']['pattern.tuple.struct']['type'];
		}
	}
}
