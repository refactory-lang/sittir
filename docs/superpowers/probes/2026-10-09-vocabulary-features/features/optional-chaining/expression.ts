import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export interface Subscript<G extends GrammarContext> {
		readonly optionalChain?: boolean;
	}
}
