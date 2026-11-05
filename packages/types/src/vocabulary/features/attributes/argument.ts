import type { GrammarContext } from '../../context.ts';
export interface Argument<G extends GrammarContext<G>> {
	readonly attributes?: G['attribute'][];
	// r only
}
