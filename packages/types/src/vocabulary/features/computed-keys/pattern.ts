import type { GrammarContext } from '../../context.ts';
import type { Flag } from '../../utils.ts';
export namespace Pattern {
	export namespace Object {
		export interface Pair<G extends GrammarContext<G>> {
			readonly computed?: Flag;
		}
	}
}
