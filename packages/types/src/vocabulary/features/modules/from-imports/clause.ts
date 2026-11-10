import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export namespace Import {
		export interface Relative<G extends GrammarMap, K extends Under<'clause.import.relative'> = 'clause.import.relative'> extends SubKindOf<V.Clause.Import<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly dots?: Slot<G, K, 'dots', V.Clause.Import.Relative.Prefix<G>>;
			readonly name?: Slot<G, K, 'name', V.Identifier.Qualified<G>>;
		}
		export namespace Relative {
			export interface Prefix<G extends GrammarMap, K extends Under<'clause.import.relative.prefix'> = 'clause.import.relative.prefix'> extends SubKindOf<V.Clause.Import.Relative<G, K>> {
				// claimed by p
				readonly $path: K;
			}
		}
	}
}
