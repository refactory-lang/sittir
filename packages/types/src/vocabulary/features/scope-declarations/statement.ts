import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Global<G extends GrammarMap, K extends Under<'statement.global'> = 'statement.global'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly names: Slot<G, K, 'names', V.Identifier.Any<G>>[];
	}
	export interface Nonlocal<G extends GrammarMap, K extends Under<'statement.nonlocal'> = 'statement.nonlocal'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly names: Slot<G, K, 'names', V.Identifier.Any<G>>[];
	}
}
