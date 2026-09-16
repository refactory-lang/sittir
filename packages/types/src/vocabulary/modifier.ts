// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Modifier<G extends GrammarContext> {
	readonly kind: 'modifier';
}

export namespace Modifier {
	export interface Extern<G extends GrammarContext> extends V.Modifier<G> {
		// claimed by r
		readonly kind: 'modifier.extern';
		readonly abi?: V.Literal.String<G>;
	}
	export interface Visibility<G extends GrammarContext> extends V.Modifier<G> {
		// claimed by r
		readonly kind: 'modifier.visibility';
		readonly content?: V.Identifier.Crate<G> | V.Modifier.Visibility.Pub<G>;
	}
	export namespace Visibility {
		export interface Pub<G extends GrammarContext> extends V.Modifier.Visibility<G> {
			// claimed by r
			readonly kind: 'modifier.visibility.pub';
			readonly visibilityModifierGroup?: V.Unmapped<'rust:visibility_modifier_group'>;
			// unmapped: <rust:visibility_modifier_group>
		}
		export type Any<G extends GrammarContext> = V.Modifier.Visibility<G> | V.Modifier.Visibility.Pub<G>;
	}
	export type Any<G extends GrammarContext> =
		| V.Modifier.Extern<G>
		| V.Modifier.Visibility<G>
		| V.Modifier.Visibility.Pub<G>;
}
