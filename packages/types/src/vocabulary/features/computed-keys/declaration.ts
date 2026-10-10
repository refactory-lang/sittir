import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly computed?: boolean;
	}
	export interface Method<G extends GrammarContext<G>> {
		readonly computed?: boolean;
	}
}
