import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly const?: Flag;
		// r only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly const?: Flag;
		// rt only
	}
	export namespace Method {
		export interface Static<G extends GrammarContext<G>> {
			readonly const?: Flag;
			// r only
		}
	}
}
