import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Variable<G extends GrammarMap> {
		readonly static?: Flag;
		// r only
	}
}
