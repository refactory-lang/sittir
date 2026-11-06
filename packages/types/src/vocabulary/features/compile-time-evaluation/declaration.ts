import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap> {
		readonly const?: Flag;
		// r only
	}
	export interface Method<G extends GrammarMap> {
		readonly const?: Flag;
		// rt only
	}
}
