import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export namespace Import {
		export interface List<G extends GrammarMap, K extends Under<'clause.import.list'> = 'clause.import.list'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly useClauses?: Slot<
				G,
				K,
				'useClauses',
				| V.Identifier.Any<G>
				| V.Clause.Import.Alias<G>
				| V.Clause.Import.List.Any<G>
				| V.Clause.Import.Wildcard<G>
			>[];
		}
		export namespace List {
			export interface Scoped<G extends GrammarMap, K extends Under<'clause.import.list.scoped'> = 'clause.import.list.scoped'> extends SubKindOf<V.Clause.Import.List<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly list: Slot<G, K, 'list', V.Clause.Import.List<G>>;
				readonly path?: Slot<G, K, 'path', V.Identifier.Any<G>>;
			}
		}
	}
}
