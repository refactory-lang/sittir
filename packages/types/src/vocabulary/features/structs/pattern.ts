import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Struct<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.struct';
		readonly fields?: G['slots']['pattern.struct']['fields'][];
		readonly type?: V.Identifier<G> | V.Identifier.Qualified<G>;
	}
	export namespace Struct {
		export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Struct<G>> {
			// claimed by pr
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
}
