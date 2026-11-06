import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Debugger<G extends GrammarMap, K extends Under<'statement.debugger'> = 'statement.debugger'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $path: K;
	}
}
