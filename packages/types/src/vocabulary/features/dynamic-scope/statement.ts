import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Scope<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.scope';
		readonly body: G['slots']['statement.scope']['body'];
		readonly object: V.Expression.Parenthesized<G>;
	}
}
