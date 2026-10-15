import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Range<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.range';
		readonly end?: G['slots']['expression.range']['end'];
		readonly start?: G['slots']['expression.range']['start'];
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Range<G>> {
			// claimed by r
			readonly $kind: 'expression.range.exclusive';
		}
		export interface Inclusive<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Range<G>> {
			// claimed by r
			readonly $kind: 'expression.range.inclusive';
		}
	}
}
