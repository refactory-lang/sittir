import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface Construct<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			// claimed by t
			readonly $kind: 'expression.call.construct';
			readonly arguments?: G['slots']['expression.call.construct']['arguments'][];
			readonly function: G['slots']['expression.call.construct']['function'];
		}
	}
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by t
		readonly $kind: 'expression.class';
		readonly body: G['slots']['expression.class']['body'][];
		readonly name?: V.Identifier.Type<G>;
	}
}
