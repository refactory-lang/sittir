// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Identifier<G extends GrammarContext> {
	// claimed by prt
	readonly $kind: 'identifier';
}

export namespace Identifier {
	export interface Crate<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.crate';
	}
	export interface Dotted<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by p
		readonly $kind: 'identifier.dotted';
		readonly names: G['identifier'][];
	}
	export interface Field<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.field';
		readonly content: G['identifier'];
	}
	export interface Label<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.label';
		readonly content?: G['identifier'];
		// t only
		readonly name?: G['identifier'];
		// r only
	}
	export interface Lifetime<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.lifetime';
		readonly name: G['identifier'];
	}
	export interface Metavariable<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.metavariable';
		readonly attributes?: G['attribute'][];
		readonly name: G['slots']['identifier.metavariable']['name'];
	}
	export interface Nested<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.nested';
		readonly object: G['identifier'];
		readonly property: V.Identifier.Property<G>;
	}
	export interface Property<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by t
		readonly $kind: 'identifier.property';
		readonly content?: G['identifier'];
	}
	export namespace Property {
		export interface Computed<G extends GrammarContext> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.computed';
			readonly expression: G['slots']['identifier.property.computed']['expression'];
		}
		export interface Private<G extends GrammarContext> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.private';
			readonly content: G['slots']['identifier.property.private']['content'];
		}
		export interface Shorthand<G extends GrammarContext> extends SubKindOf<V.Identifier.Property<G>> {
			// claimed by t
			readonly $kind: 'identifier.property.shorthand';
			readonly content: G['identifier'];
		}
		export type Any<G extends GrammarContext> =
			| V.Identifier.Property<G>
			| V.Identifier.Property.Computed<G>
			| V.Identifier.Property.Private<G>
			| V.Identifier.Property.Shorthand<G>;
	}
	export interface Scoped<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by r
		readonly $kind: 'identifier.scoped';
		readonly name: G['identifier'];
		readonly path?: G['slots']['identifier.scoped']['path'];
	}
	export interface Self<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.self';
	}
	export interface Super<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by rt
		readonly $kind: 'identifier.super';
	}
	export interface Type<G extends GrammarContext> extends SubKindOf<V.Identifier<G>> {
		// claimed by prt
		readonly $kind: 'identifier.type';
		readonly content?: G['identifier'];
		// rt only
	}
	export type Any<G extends GrammarContext> =
		| V.Identifier<G>
		| V.Identifier.Crate<G>
		| V.Identifier.Dotted<G>
		| V.Identifier.Field<G>
		| V.Identifier.Label<G>
		| V.Identifier.Lifetime<G>
		| V.Identifier.Metavariable<G>
		| V.Identifier.Nested<G>
		| V.Identifier.Property<G>
		| V.Identifier.Property.Computed<G>
		| V.Identifier.Property.Private<G>
		| V.Identifier.Property.Shorthand<G>
		| V.Identifier.Scoped<G>
		| V.Identifier.Self<G>
		| V.Identifier.Super<G>
		| V.Identifier.Type<G>;
}
