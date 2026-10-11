import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Try<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.try';
			readonly body: V.Statement.Block<G>;
		}
	}
	export interface Try<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.try';
		readonly argument: G['slots']['expression.try']['argument'];
	}
}
