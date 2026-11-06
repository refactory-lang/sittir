import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarMap, K extends Under<'type.function'> = 'type.function'> {
		readonly forLifetimes?: Slot<G, K, 'forLifetimes', V.Clause.Lifetimes<G>>;
		// r only
	}
	export interface Reference<G extends GrammarMap, K extends Under<'type.reference'> = 'type.reference'> {
		readonly lifetime?: Slot<G, K, 'lifetime', V.Identifier.Lifetime<G>>;
	}
}
