import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export namespace Import {
		export interface Alias<G extends GrammarMap, K extends Under<'clause.import.alias'> = 'clause.import.alias'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly alias: Slot<G, K, 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G> | string>;
		}
	}
}
