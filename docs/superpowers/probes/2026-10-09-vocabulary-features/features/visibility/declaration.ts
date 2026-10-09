import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export interface Enum<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export interface EnumMember<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
		export interface Tuple<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
	export interface Field<G extends GrammarContext> {
		readonly visibility?: G['slots']['declaration.field']['visibility'];
		readonly visibilityScope?: G['identifier'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext> {
			readonly visibility?: G['slots']['declaration.field.signature']['visibility'];
		}
	}
	export interface Function<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
	export interface Method<G extends GrammarContext> {
		readonly visibility?: G['slots']['declaration.method']['visibility'];
		readonly visibilityScope?: G['identifier'];
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext> {
			readonly visibility?: G['slots']['declaration.method.signature']['visibility'];
			readonly visibilityScope?: G['identifier'];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext> {
				readonly visibility?: G['slots']['declaration.method.signature.abstract']['visibility'];
			}
		}
		export interface Static<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
	export interface Parameter<G extends GrammarContext> {
		readonly visibility?: G['slots']['declaration.parameter']['visibility'];
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext> {
			readonly visibility?: G['slots']['declaration.parameter.optional']['visibility'];
		}
	}
	export interface TypeAlias<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export interface Union<G extends GrammarContext> {
		readonly visibility?: V.AccessLevel;
		readonly visibilityScope?: G['identifier'];
	}
	export namespace Variable {
		export interface Static<G extends GrammarContext> {
			readonly visibility?: V.AccessLevel;
			readonly visibilityScope?: G['identifier'];
		}
	}
}
