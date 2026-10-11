import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly readonly?: Flag;
		// t only
	}
	export namespace Field {
		export interface Signature<G extends GrammarContext<G>> {
			readonly readonly?: Flag;
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly readonly?: Flag;
		// t only
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly readonly?: Flag;
			// t only
		}
	}
	export interface Parameter<G extends GrammarContext<G>> {
		readonly readonly?: Flag;
		// t only
	}
}
