import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap> {
		readonly implements?: Slot<G, 'declaration.class', 'implements', V.Identifier.Any<G> | V.Type.Any<G>>[];
		// t only
	}
}
