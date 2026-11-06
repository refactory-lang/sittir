import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Const<G extends GrammarMap, K extends Under<'expression.block.const'> = 'expression.block.const'> extends SubKindOf<V.Expression.Block<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
		}
	}
}
