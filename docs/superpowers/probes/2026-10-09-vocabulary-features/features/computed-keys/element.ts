import type { GrammarContext } from '../../context.ts';
export namespace Element {
	export interface Pair<G extends GrammarContext> {
		readonly computed?: boolean;
	}
}
