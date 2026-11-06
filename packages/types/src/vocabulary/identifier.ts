import type { GrammarMap, Slot, Text } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarMap> {
	// claimed by prt
	readonly $kind: 'identifier';
}

export interface IdentifierSynonyms {
	readonly qualified: 'dotted' | 'nested' | 'scoped' | 'path';
	readonly receiver: 'self' | 'this';
	readonly super: 'base';
}

export namespace Identifier {
	export interface Qualified<G extends GrammarMap> extends SubKindOf<V.Identifier<G>> {
		// claimed by prt
		readonly $kind: 'identifier.qualified';
		readonly name: Slot<G, 'identifier.qualified', 'name', V.Identifier.Any<G>>;
		readonly qualifier?: Slot<G, 'identifier.qualified', 'qualifier', V.Identifier.Any<G> | string | V.Type.Any<G>>;
	}
	// claimed by t
	export type Super<G extends GrammarMap> = Text<G, 'identifier.super'>;
}
