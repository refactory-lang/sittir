import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Const<G extends GrammarContext> extends SubKindOf<V.Expression.Block<G>> {
			readonly $kind: 'expression.block.const';
			readonly body: V.Statement.Block<G>;
		}
	}
}
