import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Switch<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.switch';
		readonly body: (V.Clause.Case.Default<G> | V.Clause.Case.Switch<G>)[];
		readonly value: V.Expression.Parenthesized<G>;
	}
}
