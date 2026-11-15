import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarMap, K extends Under<'identifier'> = 'identifier'> {
	// claimed by prt
	readonly $path: K;
	readonly $value: string;
}

export interface IdentifierSynonyms {
	readonly qualified: 'dotted' | 'nested' | 'scoped' | 'path';
	readonly receiver: 'self' | 'this';
	readonly super: 'base';
}

export namespace Identifier {
	export interface Qualified<G extends GrammarMap, K extends Under<'identifier.qualified'> = 'identifier.qualified'> extends SubKindOf<V.Identifier<G, K>, '$value'> {
		// claimed by prt
		readonly $path: K;
		readonly $value?: never;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly qualifier?: Slot<G, K, 'qualifier', V.Identifier.Any<G> | string | V.Type.Any<G>>;
	}
}
