import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Variable<G extends GrammarContext<G>> {
		readonly static?: Flag;
		// r only
	}
}
