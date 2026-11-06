import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export interface Argument<G extends GrammarMap> {
	readonly attributes?: Slot<G, 'argument', 'attributes', V.Attribute.Any<G>>[];
	// r only
}
