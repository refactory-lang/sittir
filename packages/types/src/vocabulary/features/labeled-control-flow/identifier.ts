import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Identifier {
	export interface Label<G extends GrammarMap, K extends Under<'identifier.label'> = 'identifier.label'> extends SubKindOf<V.Identifier<G, K>> {
		// claimed by rt
		readonly $kind: K;
		readonly name?: Slot<G, 'identifier.label', 'name', V.Identifier.Any<G>>;
		// r only
	}
}
