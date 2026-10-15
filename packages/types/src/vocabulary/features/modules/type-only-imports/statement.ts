import type { GrammarContext } from '../../../context.ts';
import type { Flag } from '../../../utils.ts';
export namespace Statement {
	export interface Export<G extends GrammarContext<G>> {
		readonly typeOnly?: Flag;
		// t only
	}
	export interface Import<G extends GrammarContext<G>> {
		readonly typeOnly?: Flag;
		// t only
	}
}
