import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Member<G extends GrammarContext<G>> {
		readonly privateName?: Flag;
		// t only
	}
}
