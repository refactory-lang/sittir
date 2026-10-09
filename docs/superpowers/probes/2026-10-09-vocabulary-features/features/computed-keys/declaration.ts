import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext> {
		readonly computed?: boolean;
	}
	export interface Method<G extends GrammarContext> {
		readonly computed?: boolean;
	}
}
