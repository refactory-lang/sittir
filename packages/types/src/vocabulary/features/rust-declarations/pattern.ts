import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Mutable<G extends GrammarMap, K extends Under<'pattern.mutable'> = 'pattern.mutable'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly pattern: Slot<G, K, 'pattern', unknown>;
	}
}
