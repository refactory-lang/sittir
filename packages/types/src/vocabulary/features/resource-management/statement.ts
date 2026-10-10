import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface With<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.with';
		readonly body: G['slots']['statement.with']['body'];
		readonly withClause: V.Clause.With<G>;
	}
}
