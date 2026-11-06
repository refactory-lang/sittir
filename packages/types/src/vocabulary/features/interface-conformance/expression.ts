import type { GrammarMap, Slot } from '../../map.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Class<G extends GrammarMap> {
		readonly implements?: Slot<G, 'expression.class', 'implements', V.Identifier.Any<G> | V.Type.Any<G>>[];
	}
}
