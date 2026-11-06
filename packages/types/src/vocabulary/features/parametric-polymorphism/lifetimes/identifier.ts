import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Identifier {
	export interface Lifetime<G extends GrammarMap, K extends Under<'identifier.lifetime'> = 'identifier.lifetime'> extends SubKindOf<V.Identifier<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly name: Slot<G, 'identifier.lifetime', 'name', V.Identifier.Any<G>>;
	}
}
