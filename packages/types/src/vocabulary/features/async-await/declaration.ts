import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly async?: Flag;
	}
	export namespace Function {
		export interface Signature<G extends GrammarContext<G>> {
			readonly async?: Flag;
			// t only
		}
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly async?: Flag;
	}
	export namespace Method {
		export interface Signature<G extends GrammarContext<G>> {
			readonly async?: Flag;
			// t only
		}
		export interface Static<G extends GrammarContext<G>> {
			readonly async?: Flag;
			// r only
		}
	}
}
