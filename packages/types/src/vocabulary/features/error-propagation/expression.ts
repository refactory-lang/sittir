import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Try<G extends GrammarMap> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.try';
			readonly body: V.Statement.Block<G>;
		}
	}
	export interface Propagate<G extends GrammarMap> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.propagate';
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
