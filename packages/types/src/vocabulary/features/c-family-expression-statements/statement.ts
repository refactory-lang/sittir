import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Expression<G extends GrammarMap, K extends Under<'statement.expression'> = 'statement.expression'> {
		readonly expression?: Slot<
			G,
			K,
			'expression',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
		>;
		// t only
	}
}
