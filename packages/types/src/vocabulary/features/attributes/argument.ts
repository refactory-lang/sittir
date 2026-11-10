import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export interface Argument<G extends GrammarMap, K extends Under<'argument'> = 'argument'> {
	readonly attributes?: Slot<G, K, 'attributes', V.Attribute.Any<G>>[];
	// r only
}
