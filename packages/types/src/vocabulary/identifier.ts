import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarContext<G>> {
	// claimed by prt
	readonly $kind: 'identifier';
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
		readonly content: G['identifier'];
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
		readonly content?: G['identifier'];
	}
	export namespace Property {
		export interface Computed<G extends GrammarContext<G>> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.computed';
			readonly expression: G['slots']['identifier.property.computed']['expression'];
		}
		// @ts-expect-error identifier.property.private: its content fill is unknown, outside identifier.property's identifier role.
		export interface Private<G extends GrammarContext<G>> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.private';
			readonly content: G['slots']['identifier.property.private']['content'];
		}
		export interface Shorthand<G extends GrammarContext<G>> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.shorthand';
			readonly content: G['identifier'];
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
		readonly content?: G['identifier'];
		// rt only
	}
}
