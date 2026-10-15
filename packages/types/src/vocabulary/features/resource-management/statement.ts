import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Resource<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.resource';
		readonly body: G['slots']['statement.resource']['body'];
		readonly withClause: V.Clause.Resource<G>;
	}
}
