import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Assignment<G extends GrammarContext<G>> {
		readonly disposable?: Flag;
	}
}
