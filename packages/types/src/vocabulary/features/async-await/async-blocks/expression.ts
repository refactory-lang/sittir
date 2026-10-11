import type { GrammarContext } from '../../../context.ts';
import type { Flag, SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Async<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.async';
			readonly body: V.Statement.Block<G>;
			readonly move?: Flag;
		}
	}
}
