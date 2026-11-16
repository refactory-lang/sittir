import type { GrammarMap } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export interface Bounds<G extends GrammarMap, K extends Under<'clause.bounds'> = 'clause.bounds'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by r
		readonly $path: K;
	}
}
