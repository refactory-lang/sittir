import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Import<G extends GrammarMap, K extends Under<'clause.import'> = 'clause.import'> extends SubKindOf<V.Clause<G, K>> {
		readonly $path: K;
	}
}
