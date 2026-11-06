import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Label<G extends GrammarMap> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.label';
		readonly name?: Slot<G, 'identifier.label', 'name', V.Identifier.Any<G>>;
		// r only
	}
}
