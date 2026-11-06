import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Type {
	export interface Function<G extends GrammarMap> {
		readonly unsafe?: Flag;
		// r only
	}
}
