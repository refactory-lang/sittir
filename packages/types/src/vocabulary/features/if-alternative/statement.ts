import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface If<G extends GrammarMap, K extends Under<'statement.if'> = 'statement.if'> {
		readonly alternative?: Slot<G, K, 'alternative', V.Clause.Else<G>>;
		// rt only
	}
}
