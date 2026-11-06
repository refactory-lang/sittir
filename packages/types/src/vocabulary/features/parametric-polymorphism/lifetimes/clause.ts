import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Lifetimes<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.lifetimes';
		readonly lifetimes: V.Identifier.Lifetime<G>[];
	}
}
