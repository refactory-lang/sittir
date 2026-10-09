import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export interface Member<G extends GrammarContext> {
		readonly private?: boolean;
	}
}
