import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Resource<G extends GrammarMap, K extends Under<'statement.resource'> = 'statement.resource'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly body: Slot<G, 'statement.resource', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly withClause: V.Clause.Resource<G>;
	}
}
