import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Block<G extends GrammarMap, K extends Under<'statement.block'> = 'statement.block'> {
		readonly trailingExpression?: Slot<
			G,
			K,
			'trailingExpression',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
	export interface Break<G extends GrammarMap, K extends Under<'statement.break'> = 'statement.break'> {
		readonly expression?: Slot<
			G,
			K,
			'expression',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
		// r only
	}
}
