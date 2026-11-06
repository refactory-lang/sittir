import type { GrammarMap } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Function<G extends GrammarMap> {
		readonly forLifetimes?: V.Clause.Lifetimes<G>;
		// r only
	}
	export interface Reference<G extends GrammarMap> {
		readonly lifetime?: V.Identifier.Lifetime<G>;
	}
}
