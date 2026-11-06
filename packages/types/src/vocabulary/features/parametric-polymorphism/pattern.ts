import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Generic<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.generic';
		readonly name: Slot<G, 'pattern.generic', 'name', V.Identifier.Any<G>>;
		readonly typeArguments: V.Element.TypeArgument<G>[];
	}
}
