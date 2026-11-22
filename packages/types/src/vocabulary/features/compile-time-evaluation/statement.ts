import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Const<G extends GrammarMap, K extends Under<'statement.block.const'> = 'statement.block.const'> extends SubKindOf<V.Statement.Block<G, K>> {
			// claimed by r
			readonly $path: K;
		}
	}
}
