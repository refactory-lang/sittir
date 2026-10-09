import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Expression {
	export namespace Function {
		export interface Generator<G extends GrammarContext> extends SubKindOf<V.Expression.Function<G>> {
			readonly $kind: 'expression.function.generator';
			readonly body: V.Statement.Block<G>;
			readonly generator?: boolean;
			readonly name?: G['identifier'];
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
	}
	export namespace Yield {
		export interface Delegate<G extends GrammarContext> extends SubKindOf<V.Expression.Yield<G>> {
			readonly $kind: 'expression.yield.delegate';
			readonly expression: G['slots']['expression.yield.delegate']['expression'];
		}
	}
}
