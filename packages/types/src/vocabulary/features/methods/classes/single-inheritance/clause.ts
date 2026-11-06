import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export interface Extends<G extends GrammarMap, K extends Under<'clause.extends'> = 'clause.extends'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly types?: Slot<G, 'clause.extends', 'types', unknown>[];
	}
}
