import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Static<G extends GrammarMap> extends SubKindOf<V.Statement.Block<G>> {
			// claimed by t
			readonly $kind: 'statement.block.static';
			readonly body: V.Statement.Block<G>;
		}
	}
}
