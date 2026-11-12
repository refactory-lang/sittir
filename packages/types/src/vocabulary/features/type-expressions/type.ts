import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
export interface Type<G extends GrammarMap, K extends Under<'type'> = 'type'> {
	readonly content?: Slot<G, K, 'content', unknown>;
	// prt only
}
