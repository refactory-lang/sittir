import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Implements<G extends GrammarMap, K extends Under<'clause.implements'> = 'clause.implements'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly types: Slot<G, K, 'types', V.Identifier.Any<G> | V.Type.Any<G>>[];
	}
}
