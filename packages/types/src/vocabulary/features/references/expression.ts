import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Lambda<G extends GrammarContext<G>> {
		readonly move?: Flag;
		// r only
	}
	export interface Reference<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by r
		readonly $kind: 'expression.reference';
		readonly argument: G['slots']['expression.reference']['argument'];
		readonly exclusive?: Flag;
		readonly raw?: Flag;
		readonly writable?: Flag;
	}
	export namespace Unary {
		export interface Deref<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Unary<G>> {
			readonly $kind: 'expression.unary.deref';
		}
	}
}
