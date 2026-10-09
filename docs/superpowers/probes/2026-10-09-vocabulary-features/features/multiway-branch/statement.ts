import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Switch<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.switch';
		readonly body: V.Clause.Case.Any<G>[];
		readonly value: V.Expression.Parenthesized<G>;
	}
}
