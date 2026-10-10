import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Declaration<G extends GrammarContext<G>> {
	readonly $kind: 'declaration';
}

export namespace Declaration {
	export interface Constant<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by pr
		readonly $kind: 'declaration.constant';
		readonly name: G['identifier'];
		// r only
		readonly value?: G['slots']['declaration.constant']['value'];
		// r only
	}
	export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by rt
		readonly $kind: 'declaration.field';
		readonly name: G['slots']['declaration.field']['name'];
		readonly static?: boolean;
		// t only
		readonly value?: G['slots']['declaration.field']['value'];
		// t only
	}
	export interface Function<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.function';
		readonly body?: G['slots']['declaration.function']['body'];
		readonly default?: boolean;
		// r only
		readonly doc?: V.Literal.String<G>;
		// p only
		readonly name: G['identifier'];
		readonly parameters: G['slots']['declaration.function']['parameters'][];
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Function<G>> {
			// claimed by rt
			readonly $kind: 'declaration.function.signature';
			readonly functionModifiers?: G['slots']['declaration.function.signature']['functionModifiers'][];
			// r only
			readonly name: G['identifier'];
			readonly parameters: G['slots']['declaration.function.signature']['parameters'][];
		}
	}
	export namespace Method {
		// claimed by p content-derived
	}
	export interface Parameter<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.parameter';
		readonly mutable?: boolean;
		// r only
		readonly name?: G['slots']['declaration.parameter']['name'];
	}
	export namespace Parameter {
		export interface Default<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.default';
			readonly name: G['slots']['declaration.parameter.default']['name'];
		}
		export interface Typed<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed';
			readonly name: G['slots']['declaration.parameter.typed']['name'];
		}
		export interface TypedDefault<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Parameter<G>> {
			// claimed by p
			readonly $kind: 'declaration.parameter.typed_default';
			readonly name: G['identifier'];
		}
	}
	export interface Variable<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		// claimed by prt
		readonly $kind: 'declaration.variable';
		readonly alternative?: V.Statement.Block<G>;
		// r only
		readonly binding?: G['slots']['declaration.variable']['binding'];
		// t only
		readonly declarators?: V.Declaration.Variable<G>[];
		// t only
		readonly mutable?: boolean;
		// r only
		readonly name?: G['slots']['declaration.variable']['name'];
		readonly value?: G['slots']['declaration.variable']['value'];
	}
	export namespace Variable {
		export interface Constant<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.constant';
			readonly binding: 'const';
			readonly declarators: V.Declaration.Variable<G>[];
		}
		export interface Pattern<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.pattern';
			readonly name: G['slots']['declaration.variable.pattern']['name'];
			readonly value?: G['slots']['declaration.variable.pattern']['value'];
		}
		export interface Reassignable<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by t
			readonly $kind: 'declaration.variable.reassignable';
			readonly binding?: 'let';
			readonly declarators: V.Declaration.Variable<G>[];
		}
		export namespace Reassignable {
			export interface FunctionScoped<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable.Reassignable<G>> {
				// claimed by t
				readonly $kind: 'declaration.variable.reassignable.function_scoped';
				readonly binding?: never;
			}
		}
		export interface Static<G extends GrammarContext<G>> extends SubKindOf<V.Declaration.Variable<G>> {
			// claimed by r
			readonly $kind: 'declaration.variable.static';
			readonly mutable?: boolean;
			readonly name: G['identifier'];
			readonly ref?: boolean;
			readonly value?: G['slots']['declaration.variable.static']['value'];
		}
	}
}
