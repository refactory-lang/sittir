import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Print<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.print';
		readonly arguments?: G['slots']['statement.print']['arguments'][];
		readonly destination?: G['slots']['statement.print']['destination'];
		readonly trailingComma?: Flag;
	}
}
