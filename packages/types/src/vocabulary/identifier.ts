import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'identifier';
}

export interface IdentifierSynonyms {
	readonly qualified: 'dotted' | 'nested' | 'scoped' | 'path';
	readonly receiver: 'self' | 'this';
	readonly super: 'base';
}

export namespace Identifier {
	export interface Qualified<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by prt
		readonly $kind: 'identifier.qualified';
		readonly name: G['identifier'];
		readonly qualifier?: G['slots']['identifier.qualified']['qualifier'];
	}
	// claimed by t
	export type Super<G extends GrammarContext<G>> = G['texts']['identifier.super'];
}
