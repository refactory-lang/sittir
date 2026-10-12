import type { GrammarContext } from '../../../context.ts';
import type { Flag } from '../../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarContext<G>> {
		readonly generator?: Flag;
		// t only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly generator?: Flag;
		// t only
	}
}
