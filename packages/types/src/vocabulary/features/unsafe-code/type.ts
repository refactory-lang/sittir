import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Type {
	export interface Function<G extends GrammarContext<G>> {
		readonly unsafe?: Flag;
		// r only
	}
}
