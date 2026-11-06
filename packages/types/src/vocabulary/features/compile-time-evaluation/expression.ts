import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Const<G extends GrammarMap> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.const';
			readonly body: V.Statement.Block<G>;
		}
	}
}
