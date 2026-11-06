import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Pattern {
	export namespace Object {
		export interface Pair<G extends GrammarMap> {
			readonly computed?: Flag;
		}
	}
}
