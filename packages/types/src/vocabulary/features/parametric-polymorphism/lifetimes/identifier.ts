import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Identifier {
	export interface Lifetime<G extends GrammarMap> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.lifetime';
		readonly name: Slot<G, 'identifier.lifetime', 'name', V.Identifier.Any<G>>;
	}
}
