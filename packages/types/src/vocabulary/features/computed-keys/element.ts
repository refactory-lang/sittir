import type { GrammarMap } from '../../map.ts';
import type { Flag, Under } from '../../utils.ts';
export namespace Element {
	export interface Pair<G extends GrammarMap, K extends Under<'element.pair'> = 'element.pair'> {
		readonly computed?: Flag;
		// t only
	}
}
