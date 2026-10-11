import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export interface Enum<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export interface EnumMember<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
		}
		export interface Tuple<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
		}
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly visibility?: G['slots']['declaration.field']['visibility'];
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: G['slots']['declaration.field.signature']['visibility'];
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly visibility?: G['slots']['declaration.method']['visibility'];
		// rt only
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: G['slots']['declaration.method.signature']['visibility'];
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly visibility?: G['slots']['declaration.method.signature.abstract']['visibility'];
			}
		}
		export interface Static<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
			// r only
		}
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly visibility?: G['slots']['declaration.parameter']['visibility'];
		// t only
	}
	export interface TypeAlias<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
		// r only
	}
	export interface Union<G extends GrammarContext<G>> {
		readonly visibility?: V.Modifier.Visibility<G>;
	}
	export namespace Variable {
		export interface Static<G extends GrammarContext<G>> {
			readonly visibility?: V.Modifier.Visibility<G>;
		}
	}
}
