import type { GrammarContext } from '../../../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly override?: boolean;
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly override?: boolean;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly override?: boolean;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly override?: boolean;
		}
		export namespace Signature {
			export interface Abstract<G extends GrammarContext<G>> {
				readonly override?: boolean;
			}
		}
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly override?: boolean;
	}
	export namespace Parameter {
		export interface Optional<G extends GrammarContext<G>> {
			readonly override?: boolean;
		}
	}
}
