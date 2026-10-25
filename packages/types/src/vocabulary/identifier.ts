import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'identifier';
}

export interface IdentifierSynonyms {
	readonly receiver: 'self' | 'this';
	readonly super: 'base';
}

export namespace Identifier {
	export interface Dotted<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by p
		readonly $kind: 'identifier.dotted';
		readonly names: G['identifier'][];
	}
	export interface Nested<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.nested';
		readonly object: G['identifier'];
		readonly property: V.Identifier<G>;
	}
	export interface Scoped<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.scoped';
		readonly name: G['identifier'];
		readonly path?: G['slots']['identifier.scoped']['path'];
	}
	export interface Super<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.super';
	}
}
