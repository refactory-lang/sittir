import type { GrammarContext } from '../../context.ts';
export namespace Expression {
	export interface Assignment<G extends GrammarContext<G>> {
		readonly using?: boolean;
	}
}
