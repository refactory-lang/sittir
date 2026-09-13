// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Identifier<G extends GrammarContext> {
	// claimed by prt
	readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal']; // t only
	readonly module?: G['identifier']; // t only
	readonly name?: G['identifier']; // rt only   // unmapped: literal:Super
	readonly names?: G['identifier'][]; // p only
	readonly object?: G['identifier']; // t only
	readonly path?: G['identifier'] | V.Type.Bracketed<G> | V.Type.Generic.Turbofish<G>; // r only   // unmapped: literal:Crate literal:Self literal:Super
	readonly property?: G['identifier']; // t only
}
export namespace Identifier {
	export interface Crate<G extends GrammarContext> extends V.Identifier<G> {} // claimed by r
	export interface Dotted<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by p
		readonly names: G['identifier'][];
	}
	export interface Field<G extends GrammarContext> extends V.Identifier<G> {} // claimed by r
	export interface Jsx<G extends GrammarContext> extends V.Identifier<G> {} // claimed by t
	export namespace Jsx {
		export interface Namespace<G extends GrammarContext> extends V.Identifier.Jsx<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> = V.Identifier.Jsx.Namespace<G>;
	}
	export interface Keyword<G extends GrammarContext> extends V.Identifier<G> {} // claimed by p
	export interface Label<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by r
		readonly name: G['identifier'];
	}
	export interface Lifetime<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by r
		readonly name: G['identifier'];
	}
	export interface Metavariable<G extends GrammarContext> extends V.Identifier<G> {} // claimed by r
	export interface Nested<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by t
		readonly object: G['identifier'];
		readonly property: G['identifier'];
	}
	export interface Property<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by t
		readonly expression?: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
	}
	export namespace Property {
		export interface Computed<G extends GrammarContext> extends V.Identifier.Property<G> {
			// claimed by t
			readonly expression: V.Declaration.Module<G> | G['expression'] | G['identifier'] | G['literal'];
		}
		export interface Private<G extends GrammarContext> extends V.Identifier.Property<G> {} // claimed by t
		export interface Shorthand<G extends GrammarContext> extends V.Identifier.Property<G> {} // claimed by t
		export type Kinds<G extends GrammarContext> =
			| V.Identifier.Property.Computed<G>
			| V.Identifier.Property.Private<G>
			| V.Identifier.Property.Shorthand<G>;
	}
	export interface Scoped<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by r
		readonly name: G['identifier']; // unmapped: literal:Super
		readonly path?: G['identifier'] | V.Type.Bracketed<G> | V.Type.Generic.Turbofish<G>; // unmapped: literal:Crate literal:Self literal:Super
	}
	export interface Self<G extends GrammarContext> extends V.Identifier<G> {} // claimed by rt
	export interface Super<G extends GrammarContext> extends V.Identifier<G> {} // claimed by rt
	export interface Type<G extends GrammarContext> extends V.Identifier<G> {
		// claimed by prt
		readonly module?: G['identifier']; // t only
		readonly name?: G['identifier']; // t only
	}
	export namespace Type {
		export interface Nested<G extends GrammarContext> extends V.Identifier.Type<G> {
			// claimed by t
			readonly module: G['identifier'];
			readonly name: G['identifier'];
		}
		export type Kinds<G extends GrammarContext> = V.Identifier.Type.Nested<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Identifier.Crate<G>
		| V.Identifier.Dotted<G>
		| V.Identifier.Field<G>
		| V.Identifier.Jsx.Namespace<G>
		| V.Identifier.Keyword<G>
		| V.Identifier.Label<G>
		| V.Identifier.Lifetime<G>
		| V.Identifier.Metavariable<G>
		| V.Identifier.Nested<G>
		| V.Identifier.Property.Computed<G>
		| V.Identifier.Property.Private<G>
		| V.Identifier.Property.Shorthand<G>
		| V.Identifier.Scoped<G>
		| V.Identifier.Self<G>
		| V.Identifier.Super<G>
		| V.Identifier.Type.Nested<G>;
}
