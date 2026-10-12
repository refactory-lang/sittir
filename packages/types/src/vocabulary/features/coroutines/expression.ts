import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Expression {
	export namespace Block {
		export interface Gen<G extends GrammarContext<G>> extends SubKindOf<V.Expression.Block<G>> {
			// claimed by r
			readonly $kind: 'expression.block.gen';
			readonly body: V.Statement.Block<G>;
			readonly move?: Flag;
		}
	}
	export interface Lambda<G extends GrammarContext<G>> {
		readonly static?: Flag;
		// r only
	}
	export interface Yield<G extends GrammarContext<G>> extends SubKindOf<V.Expression<G>> {
		// claimed by prt
		readonly $kind: 'expression.yield';
		readonly content?: G['slots']['expression.yield']['content'];
		// p only
		readonly expression?: G['slots']['expression.yield']['expression'];
		// rt only
	}
}
