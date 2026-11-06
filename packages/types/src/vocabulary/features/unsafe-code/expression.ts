import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Unsafe<G extends GrammarMap, K extends Under<'expression.block.unsafe'> = 'expression.block.unsafe'> extends SubKindOf<V.Expression.Block<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly body: V.Statement.Block<G>;
		}
	}
}
