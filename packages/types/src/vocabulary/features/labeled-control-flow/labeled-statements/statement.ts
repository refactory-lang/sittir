import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Statement {
	export interface Labeled<G extends GrammarMap, K extends Under<'statement.labeled'> = 'statement.labeled'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly body: Slot<G, K, 'body', V.Declaration.Any<G> | V.Statement.Any<G>>;
		readonly label: Slot<G, K, 'label', V.Identifier.Label<G> | string>;
	}
}
