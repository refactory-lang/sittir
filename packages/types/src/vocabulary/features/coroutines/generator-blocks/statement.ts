import type { GrammarMap } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Generator<G extends GrammarMap, K extends Under<'statement.block.generator'> = 'statement.block.generator'> extends SubKindOf<V.Statement.Block<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly move?: Flag;
		}
	}
}
