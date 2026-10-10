import type { GrammarContext } from '../../../../context.ts';
export namespace Declaration {
	export interface Field<G extends GrammarContext<G>> {
		readonly definite?: boolean;
	}
	export interface Variable<G extends GrammarContext<G>> {
		readonly definite?: boolean;
	}
}
