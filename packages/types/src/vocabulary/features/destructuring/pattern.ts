import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface List<G extends GrammarMap, K extends Under<'pattern.list'> = 'pattern.list'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
}
