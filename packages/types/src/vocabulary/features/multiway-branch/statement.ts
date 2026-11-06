import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Switch<G extends GrammarMap, K extends Under<'statement.switch'> = 'statement.switch'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly body: (V.Clause.Case.Default<G> | V.Clause.Case.Switch<G>)[];
		readonly value: V.Expression.Parenthesized<G>;
	}
}
