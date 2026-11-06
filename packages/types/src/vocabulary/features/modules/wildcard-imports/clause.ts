import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export namespace Import {
		export interface Wildcard<G extends GrammarMap, K extends Under<'clause.import.wildcard'> = 'clause.import.wildcard'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly useWildcardGroup?: Slot<G, K, 'useWildcardGroup', unknown>;
			// r only
		}
	}
}
