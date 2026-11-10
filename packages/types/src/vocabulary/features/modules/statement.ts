import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Import<G extends GrammarMap, K extends Under<'statement.import'> = 'statement.import'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly argument?: Slot<
			G,
			K,
			'argument',
			| V.Identifier.Any<G>
			| V.Clause.Import.Alias<G>
			| V.Clause.Import.List.Any<G>
			| V.Clause.Import.Wildcard<G>
			| string
		>;
		// r only
		readonly fromClause?: Slot<G, K, 'fromClause', V.Clause.Import.Require<G> | V.Literal.String<G>>;
		// t only
		readonly importAttribute?: Slot<G, K, 'importAttribute', V.Clause.Import.Attribute<G>>;
		// t only
		readonly importClause?: Slot<G, K, 'importClause', V.Clause.Import.Names<G>>;
		// t only
		readonly names?: Slot<G, K, 'names', V.Clause.Import.Alias<G> | V.Identifier.Qualified<G>>[];
		// p only
		readonly source?: Slot<G, K, 'source', V.Literal.String<G>>;
		// t only
	}
}
