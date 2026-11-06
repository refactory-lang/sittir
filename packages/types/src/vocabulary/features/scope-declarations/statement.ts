import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Global<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.global';
		readonly names: Slot<G, 'statement.global', 'names', V.Identifier.Any<G>>[];
	}
	export interface Nonlocal<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.nonlocal';
		readonly names: Slot<G, 'statement.nonlocal', 'names', V.Identifier.Any<G>>[];
	}
}
