import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Scope<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.scope';
		readonly body: Slot<G, 'statement.scope', 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly object: V.Expression.Parenthesized<G>;
	}
}
