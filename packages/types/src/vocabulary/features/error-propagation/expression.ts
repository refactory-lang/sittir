import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Try<G extends GrammarMap, K extends Under<'expression.block.try'> = 'expression.block.try'> extends SubKindOf<V.Expression.Block<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body: V.Statement.Block<G>;
		}
	}
	export interface Propagate<G extends GrammarMap, K extends Under<'expression.propagate'> = 'expression.propagate'> extends SubKindOf<V.Expression<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly argument: Slot<
			G,
			'expression.propagate',
			'argument',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
