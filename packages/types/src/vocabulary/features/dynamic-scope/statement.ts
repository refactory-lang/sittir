import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Scope<G extends GrammarMap, K extends Under<'statement.scope'> = 'statement.scope'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: Slot<G, 'statement.scope', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly object: V.Expression.Parenthesized<G>;
	}
}
