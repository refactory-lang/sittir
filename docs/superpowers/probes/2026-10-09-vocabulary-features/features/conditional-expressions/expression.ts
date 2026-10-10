import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Conditional<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.conditional';
		readonly alternative: G['slots']['expression.conditional']['alternative'];
		readonly condition: G['slots']['expression.conditional']['condition'];
		readonly consequence: G['slots']['expression.conditional']['consequence'];
	}
}
