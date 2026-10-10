import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Slice<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		readonly $kind: 'expression.slice';
		readonly start?: G['slots']['expression.slice']['start'];
		readonly step?: G['slots']['expression.slice']['step'];
		readonly stop?: G['slots']['expression.slice']['stop'];
	}
}
