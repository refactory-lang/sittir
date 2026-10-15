import type { GrammarContext } from '../../../context.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.class';
		readonly body: G['slots']['declaration.class']['body'] | G['slots']['declaration.class']['body'][];
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly name: G['identifier'];
	}
	export interface Constructor<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pt
		readonly $kind: 'declaration.constructor';
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly static?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly static?: Flag;
		}
	}
	export interface Property<G extends GrammarContext<G>> {
		readonly static?: Flag;
	}
}
