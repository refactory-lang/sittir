import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export interface Class<G extends GrammarMap, K extends Under<'declaration.class'> = 'declaration.class'> {
		readonly implements?: Slot<G, K, 'implements', V.Identifier.Any<G> | V.Type.Any<G>>[];
		// t only
	}
}
