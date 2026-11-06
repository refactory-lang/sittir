import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Static<G extends GrammarMap, K extends Under<'statement.block.static'> = 'statement.block.static'> extends SubKindOf<V.Statement.Block<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly body: Slot<G, K, 'body', V.Statement.Block<G>>;
		}
	}
}
