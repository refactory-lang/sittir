import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Declaration {
	export namespace Type {
		export interface Class<G extends GrammarMap, K extends Under<'declaration.type.class'> = 'declaration.type.class'> {
			readonly implements?: Slot<G, K, 'implements', V.Identifier.Any<G> | V.Type.Any<G>>[];
			// t only
		}
	}
}
