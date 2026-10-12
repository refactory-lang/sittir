import type { GrammarContext } from '../../context.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly implements?: G['slots']['declaration.class']['implements'][];
		// t only
	}
}
