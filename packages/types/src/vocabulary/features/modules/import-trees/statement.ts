import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Import {
		export interface Package<G extends GrammarMap, K extends Under<'statement.import.package'> = 'statement.import.package'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G>>;
			readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		}
	}
}
