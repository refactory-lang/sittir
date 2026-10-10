import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Call {
		export interface New<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Call<G>> {
			readonly $kind: 'expression.call.new';
			readonly arguments?: G['slots']['expression.call.new']['arguments'][];
			readonly function: G['slots']['expression.call.new']['function'];
		}
	}
	export interface Class<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.class';
		readonly body: G['slots']['expression.class']['body'][];
		readonly name?: V.Identifier.Type<G>;
	}
}
