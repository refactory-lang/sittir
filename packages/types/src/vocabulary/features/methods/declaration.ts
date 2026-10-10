import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Method<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.method';
		readonly body?: G['slots']['declaration.method']['body'];
		readonly default?: boolean;
		readonly doc?: V.Literal.String<G>;
		readonly name: G['slots']['declaration.method']['name'];
		readonly parameters: G['slots']['declaration.method']['parameters'][];
		readonly static?: boolean;
	}
	export namespace Method {
		export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.class';
		}
		export interface Dunder<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.dunder';
			readonly name: `__${string}__`;
			readonly stem: string;
		}
		export interface Getter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.getter';
		}
		export interface Setter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.setter';
		}
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.signature';
			readonly functionModifiers?: G['slots']['declaration.method.signature']['functionModifiers'][];
			readonly name: G['slots']['declaration.method.signature']['name'];
			readonly parameters: G['slots']['declaration.method.signature']['parameters'][];
			readonly static?: boolean;
		}
		export interface Static<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Method<G>> {
			readonly $kind: 'declaration.method.static';
			readonly body: V.Statement.Block<G>;
			readonly default?: boolean;
			readonly name: G['identifier'];
			readonly parameters: G['slots']['declaration.method.static']['parameters'][];
		}
	}
	export namespace Parameter {
		export interface Self<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			readonly $kind: 'declaration.parameter.self';
			readonly mutable?: boolean;
		}
	}
}
