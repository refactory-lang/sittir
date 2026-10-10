import type { GrammarContext } from '../../../../context.ts';
export namespace Declaration {
	export interface Class<G extends GrammarContext<G>> {
		readonly bases?: G['slots']['declaration.class']['bases'][];
	}
}
