import type { GrammarContext } from '../../../context.ts';
export namespace Type {
	export interface Constrained<G extends GrammarContext> {
		readonly constraint: G['type'];
	}
}
