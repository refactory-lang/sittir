import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Pattern {
	export namespace Object {
		export interface Pair<G extends GrammarMap, K extends Under<'pattern.object.pair'> = 'pattern.object.pair'> {
			readonly computed?: Flag;
		}
	}
}
