import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Import {
		export interface From<G extends GrammarMap, K extends Under<'statement.import.from'> = 'statement.import.from'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content:
				Slot<G, K, 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>> | Slot<G, K, 'content', V.Identifier.Qualified<G> | V.Clause.Import.Any<G>>[];
			readonly moduleName: Slot<G, K, 'moduleName', V.Clause.Import.Relative<G> | V.Identifier.Qualified<G>>;
		}
		export interface Future<G extends GrammarMap, K extends Under<'statement.import.future'> = 'statement.import.future'> extends SubKindOf<V.Statement.Import<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>>[];
		}
	}
}
