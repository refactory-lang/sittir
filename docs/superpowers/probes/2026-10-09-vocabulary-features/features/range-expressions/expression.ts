import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Range<G extends GrammarContext> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.range';
	}
}
