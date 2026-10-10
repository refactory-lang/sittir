import type { GrammarContext } from '../../context.ts';
export namespace Element {
	export interface Pair<G extends GrammarContext<G>> {
		readonly computed?: boolean;
	}
}
