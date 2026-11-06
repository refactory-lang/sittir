import type { GrammarMap } from '../../../map.ts';
import type { Flag } from '../../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap> {
		readonly generator?: Flag;
		// t only
	}
	export interface Method<G extends GrammarMap> {
		readonly generator?: Flag;
		// t only
	}
}
