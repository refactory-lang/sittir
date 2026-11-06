import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Function<G extends GrammarMap> {
		readonly generator?: Flag;
	}
	export namespace Yield {
		export interface Delegate<G extends GrammarMap> extends SubKindOf<V.Expression.Yield<G>, 'expression'> {
			// claimed by pt
			readonly $kind: 'expression.yield.delegate';
			readonly expression: Slot<
				G,
				'expression.yield.delegate',
				'expression',
				| V.Declaration.Module<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>;
		}
	}
}
