import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly default?: Flag;
		// r only
	}
	export interface Method<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.method';
		readonly body?: G['slots']['declaration.method']['body'];
		readonly default?: Flag;
		// rt only
		readonly doc?: V.Literal.String<G>;
		// pt only
		readonly name: G['slots']['declaration.method']['name'];
		readonly parameters: G['slots']['declaration.method']['parameters'][];
		readonly static?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by rt
			readonly $kind: 'declaration.method.signature';
			readonly functionModifiers?: G['slots']['declaration.method.signature']['functionModifiers'][];
			// r only
			readonly name: G['slots']['declaration.method.signature']['name'];
			readonly parameters: G['slots']['declaration.method.signature']['parameters'][];
			readonly static?: Flag;
			// t only
		}
		export interface Special<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.special';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
	}
}
