import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Match<G extends GrammarContext> extends SubKindOf<V.Statement<G>> {
		readonly $kind: 'statement.match';
		readonly body: G['slots']['statement.match']['body'] | G['slots']['statement.match']['body'][];
		readonly subject?: G['slots']['statement.match']['subject'] | G['slots']['statement.match']['subject'][];
	}
}
