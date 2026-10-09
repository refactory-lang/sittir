import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Yield<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.yield';
		readonly content?: G['slots']['expression.yield']['content'];
		readonly expression?: G['slots']['expression.yield']['expression'];
	}
}
