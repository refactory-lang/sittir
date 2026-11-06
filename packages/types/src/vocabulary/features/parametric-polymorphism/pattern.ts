import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Generic<G extends GrammarMap, K extends Under<'pattern.generic'> = 'pattern.generic'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly typeArguments: Slot<G, K, 'typeArguments', V.Element.TypeArgument<G>>[];
	}
}
