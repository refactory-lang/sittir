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
	export interface Crate<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.crate';
	}
	export interface Dotted<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by p
		readonly $kind: 'identifier.dotted';
		readonly names: G['identifier'][];
	}
	export interface Field<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.field';
	}
	export interface Nested<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.nested';
		readonly object: G['identifier'];
		readonly property: V.Identifier.Property<G>;
	}
	export interface Property<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.property';
	}
	export namespace Property {
		export interface Shorthand<G extends GrammarContext<G>> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.shorthand';
		}
	}
	export interface Scoped<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.scoped';
		readonly name: G['identifier'];
		readonly path?: G['slots']['identifier.scoped']['path'];
	}
	export interface Super<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.super';
	}
	export interface Type<G extends GrammarContext<G>> extends SubKindOf<V.Identifier<G>> {
		// claimed by prt
		readonly $kind: 'identifier.type';
	}
}
