import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export interface Await<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.await';
		readonly expression: G['slots']['expression.await']['expression'];
	}
	export interface Function<G extends GrammarContext<G>> {
		readonly async?: Flag;
	}
	export interface Lambda<G extends GrammarContext<G>> {
		readonly async?: Flag;
		// rt only
	}
}
