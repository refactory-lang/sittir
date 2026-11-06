import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Resource<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.resource';
		readonly body: Slot<G, 'statement.resource', 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly withClause: V.Clause.Resource<G>;
	}
}
