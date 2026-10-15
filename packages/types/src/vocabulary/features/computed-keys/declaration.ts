import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly computed?: Flag;
		// t only
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly computed?: Flag;
		// t only
	}
	export interface Property<G extends GrammarContext<G>> {
		readonly computed?: Flag;
	}
}
