import type { GrammarContext } from '../../context.ts';
export namespace Pattern {
	export namespace Object {
		export interface Pair<G extends GrammarContext> {
			readonly computed?: boolean;
		}
	}
}
