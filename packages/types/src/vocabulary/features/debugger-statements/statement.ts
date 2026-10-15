import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Debugger<G extends GrammarContext<G>> extends SubKindOf<V.Statement<G>> {
		// claimed by t
		readonly $kind: 'statement.debugger';
	}
}
