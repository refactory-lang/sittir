// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Modifier<G extends GrammarContext> {
	readonly abi?: V.Literal.String<G>; // r only
	readonly content?: V.Identifier.Crate<G> | V.Modifier.Visibility.Pub<G>; // r only
	readonly visibilityModifierGroup?: V.Unmapped<'rust:visibility_modifier_group'>; // r only   // unmapped: <rust:visibility_modifier_group>
}
export namespace Modifier {
	export interface Extern<G extends GrammarContext> extends V.Modifier<G> {
		// claimed by r
		readonly abi?: V.Literal.String<G>;
	}
	export interface Visibility<G extends GrammarContext> extends V.Modifier<G> {
		// claimed by r
		readonly content?: V.Identifier.Crate<G> | V.Modifier.Visibility.Pub<G>;
		readonly visibilityModifierGroup?: V.Unmapped<'rust:visibility_modifier_group'>; // unmapped: <rust:visibility_modifier_group>
	}
	export namespace Visibility {
		export interface Pub<G extends GrammarContext> extends V.Modifier.Visibility<G> {
			// claimed by r
			readonly visibilityModifierGroup?: V.Unmapped<'rust:visibility_modifier_group'>; // unmapped: <rust:visibility_modifier_group>
		}
		export type Kinds<G extends GrammarContext> = V.Modifier.Visibility<G> | V.Modifier.Visibility.Pub<G>;
	}
	export type Kinds<G extends GrammarContext> =
		| V.Modifier.Extern<G>
		| V.Modifier.Visibility<G>
		| V.Modifier.Visibility.Pub<G>;
}
