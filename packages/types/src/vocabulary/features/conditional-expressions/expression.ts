import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Conditional<G extends GrammarMap, K extends Under<'expression.conditional'> = 'expression.conditional'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by pt
		readonly $kind: K;
		readonly alternative: Slot<
			G,
			'expression.conditional',
			'alternative',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly condition: Slot<
			G,
			'expression.conditional',
			'condition',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly consequence: Slot<
			G,
			'expression.conditional',
			'consequence',
			| V.Declaration.Module<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
	}
}
