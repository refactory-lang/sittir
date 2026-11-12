import type { GrammarMap } from '../../../../map.ts';
import type { Flag, Under } from '../../../../utils.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly generator?: Flag;
		// t only
	}
	export interface Method<G extends GrammarMap, K extends Under<'declaration.method'> = 'declaration.method'> {
		readonly generator?: Flag;
		// t only
	}
}
