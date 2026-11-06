import type { GrammarMap } from '../../map.ts';
import type { Flag } from '../../utils.ts';
export namespace Expression {
	export interface Member<G extends GrammarMap> {
		readonly privateName?: Flag;
		// t only
	}
}
