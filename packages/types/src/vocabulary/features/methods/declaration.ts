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
		export interface Dunder<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.dunder';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
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
		export interface Static<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			// claimed by pr
			readonly $kind: 'declaration.method.static';
			readonly body: V.Statement.Block<G>;
			// r only
			readonly default?: Flag;
			// r only
			readonly name: G['identifier'];
			// r only
			readonly parameters: G['slots']['declaration.method.static']['parameters'][];
			// r only
		}
	}
	export namespace Parameter {
		export interface Self<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by pr
			readonly $kind: 'declaration.parameter.self';
			readonly mutable?: Flag;
			// r only
		}
	}
}
