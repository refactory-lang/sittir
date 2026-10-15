import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Print<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.print';
		readonly content?: V.Statement.Print.Any<G>;
		readonly printArguments?: G['slots']['statement.print']['printArguments'][];
	}
	export namespace Print {
		export interface Chevron<G extends GrammarContext<G>> extends SubKindOf<V.Statement.Print<G>> {
			// claimed by p
			readonly $kind: 'statement.print.chevron';
			readonly chevron: V.Clause.Print.Chevron<G>;
			readonly printChevronArguments?:
				| G['slots']['statement.print.chevron']['printChevronArguments']
				| G['slots']['statement.print.chevron']['printChevronArguments'][];
		}
	}
}
