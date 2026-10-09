import type { GrammarContext } from '../../context.ts';
export namespace Identifier {
	export interface Metavariable<G extends GrammarContext> {
		readonly attributes?: G['attribute'][];
	}
}
