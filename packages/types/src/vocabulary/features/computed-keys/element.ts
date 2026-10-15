import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Element {
	export interface Pair<G extends GrammarContext<G>> {
		readonly computed?: Flag;
		// t only
	}
}
