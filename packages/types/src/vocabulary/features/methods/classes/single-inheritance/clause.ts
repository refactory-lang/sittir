import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export interface Extends<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.extends';
		readonly types?: Slot<G, 'clause.extends', 'types', unknown>[];
	}
}
