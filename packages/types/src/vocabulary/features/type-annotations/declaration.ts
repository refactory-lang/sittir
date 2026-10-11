import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext<G>> {
		readonly type: G['slots']['declaration.constant']['type'];
		// r only
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly type?: G['slots']['declaration.field']['type'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly type?: G['slots']['declaration.field.signature']['type'];
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly returnType?: G['slots']['declaration.function']['returnType'];
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly returnType?: G['slots']['declaration.function.signature']['returnType'];
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly returnType?: G['slots']['declaration.method']['returnType'];
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly returnType?: G['slots']['declaration.method.signature']['returnType'];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly returnType?: G['slots']['declaration.method.signature.abstract']['returnType'];
			}
		}
		export interface Static<G extends GrammarContext<G>> {
			readonly returnType?: G['slots']['declaration.method.static']['returnType'];
			// r only
		}
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly type?: G['slots']['declaration.parameter']['type'];
	}
	export namespace Parameter {
		export interface Typed<G extends GrammarContext<G>> {
			readonly type: G['type'];
		}
		export interface TypedDefault<G extends GrammarContext<G>> {
			readonly type: G['type'];
		}
	}
	export interface Variable<G extends GrammarContext<G>> {
		readonly type?: G['slots']['declaration.variable']['type'];
	}
	export namespace Variable {
		export interface Pattern<G extends GrammarContext<G>> {
			readonly type?: G['slots']['declaration.variable.pattern']['type'];
		}
		export interface Static<G extends GrammarContext<G>> {
			readonly type: G['slots']['declaration.variable.static']['type'];
		}
	}
}
