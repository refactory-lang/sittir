import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Element {
	export interface Pair<G extends GrammarMap> {
		readonly computed?: Flag;
		// t only
	}
}
