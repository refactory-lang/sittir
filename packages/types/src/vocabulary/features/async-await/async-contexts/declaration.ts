import type { GrammarMap } from '../../../map.ts';
import type { Flag, Under } from '../../../utils.ts';
export namespace Declaration {
	export interface Constructor<G extends GrammarMap, K extends Under<'declaration.constructor'> = 'declaration.constructor'> {
		readonly async?: Flag;
		// p only
	}
}
