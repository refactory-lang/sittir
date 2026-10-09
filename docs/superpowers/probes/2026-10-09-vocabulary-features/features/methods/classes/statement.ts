import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export namespace Block {
		export interface Static<G extends GrammarContext> extends SubKindOf<V.Statement.Block<G>> {
			readonly $kind: 'statement.block.static';
			readonly body: V.Statement.Block<G>;
		}
	}
}
