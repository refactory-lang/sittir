import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Lifetimes<G extends GrammarMap, K extends Under<'clause.lifetimes'> = 'clause.lifetimes'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly lifetimes: V.Identifier.Lifetime<G>[];
	}
}
