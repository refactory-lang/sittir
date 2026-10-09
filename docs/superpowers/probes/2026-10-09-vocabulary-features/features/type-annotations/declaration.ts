import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext> {
		readonly type: G['slots']['declaration.constant']['type'];
	}
	export interface Field<G extends GrammarContext> {
		readonly type?: G['slots']['declaration.field']['type'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext> {
			readonly type?: G['slots']['declaration.field.signature']['type'];
		}
	}
	export interface Function<G extends GrammarContext> {
		readonly returnType?: G['slots']['declaration.function']['returnType'];
	}
	export namespace Function {
		export interface Generator<G extends GrammarContext> {
			readonly returnType?: G['slots']['declaration.function.generator']['returnType'];
		}
		export interface Signature<G extends GrammarContext> {
			readonly returnType?: G['slots']['declaration.function.signature']['returnType'];
		}
	}
	export interface Method<G extends GrammarContext> {
		readonly returnType?: G['slots']['declaration.method']['returnType'];
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext> {
			readonly returnType?: G['slots']['declaration.method.signature']['returnType'];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> {
				readonly returnType?: G['slots']['declaration.method.signature.abstract']['returnType'];
			}
		}
		export interface Static<G extends GrammarContext> {
			readonly returnType?: G['slots']['declaration.method.static']['returnType'];
		}
	}
	export interface Parameter<G extends GrammarContext> {
		readonly type?: G['slots']['declaration.parameter']['type'];
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext> {
			readonly type?: G['slots']['declaration.parameter.optional']['type'];
		}
		export interface Typed<G extends GrammarContext> {
			readonly type: G['type'];
		}
		export interface TypedDefault<G extends GrammarContext> {
			readonly type: G['type'];
		}
	}
	export interface Variable<G extends GrammarContext> {
		readonly type?: G['slots']['declaration.variable']['type'];
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarContext> {
			readonly type?: G['slots']['declaration.variable.pattern']['type'];
		}
		export interface Static<G extends GrammarContext> {
			readonly type: G['slots']['declaration.variable.static']['type'];
		}
	}
}
