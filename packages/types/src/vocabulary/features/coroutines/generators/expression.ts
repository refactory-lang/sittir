import type { GrammarContext } from '../../../context.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export interface Function<G extends GrammarContext<G>> {
		readonly generator?: Flag;
	}
	export namespace Yield {
		export interface Delegate<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Yield<G>> {
			// claimed by pt
			readonly $kind: 'expression.yield.delegate';
			readonly expression: G['slots']['expression.yield.delegate']['expression'];
		}
	}
}
