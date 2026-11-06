import type { GrammarMap, Slot } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Async<G extends GrammarMap, K extends Under<'expression.block.async'> = 'expression.block.async'> extends SubKindOf<V.Expression.Block<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
			readonly move?: Flag;
		}
	}
}
