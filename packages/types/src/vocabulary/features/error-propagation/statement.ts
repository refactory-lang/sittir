import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Try<G extends GrammarMap, K extends Under<'statement.block.try'> = 'statement.block.try'> extends SubKindOf<V.Statement.Block<G, K>> {
			// claimed by r
			readonly $path: K;
		}
	}
}
