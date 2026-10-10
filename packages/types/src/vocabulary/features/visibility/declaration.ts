import type { GrammarContext } from '../../context.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Constant<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export interface Enum<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export interface EnumMember<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace EnumMember {
		export interface Struct<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
		export interface Tuple<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export namespace Interface {
		export interface Trait<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly visibility?: V.AccessLevel;
			}
		}
		export interface Static<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
	export interface TypeAlias<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export interface Union<G extends GrammarContext<G>> {
		readonly visibility?: V.AccessLevel;
	}
	export namespace Variable {
		export interface Static<G extends GrammarContext<G>> {
			readonly visibility?: V.AccessLevel;
		}
	}
}
