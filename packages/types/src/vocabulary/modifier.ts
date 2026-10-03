// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type { Simplify } from 'type-fest';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Modifier<G extends GrammarContext> {
	readonly kind: 'modifier';
}

export namespace Modifier {
	export interface Extern<G extends GrammarContext> extends Simplify<SubKindOf<V.Modifier<G>>> {
		// claimed by r
		readonly kind: 'modifier.extern';
		readonly abi?: V.Literal.String<G>;
	}
	export interface Visibility<G extends GrammarContext> extends Simplify<SubKindOf<V.Modifier<G>>> {
		// claimed by r
		readonly kind: 'modifier.visibility';
		readonly content?: V.Identifier.Crate<G> | V.Modifier.Visibility.Pub<G>;
	}
	export namespace Visibility {
		export interface Pub<G extends GrammarContext> extends Simplify<SubKindOf<V.Modifier.Visibility<G>>> {
			// claimed by r
			readonly kind: 'modifier.visibility.pub';
			readonly visibilityModifierPubScope?:
				| G['identifier']
				| 'bool'
				| 'char'
				| 'default'
				| 'f32'
				| 'f64'
				| 'gen'
				| 'i128'
				| 'i16'
				| 'i32'
				| 'i64'
				| 'i8'
				| 'isize'
				| 'str'
				| 'u128'
				| 'u16'
				| 'u32'
				| 'u64'
				| 'u8'
				| 'union'
				| 'usize';
		}
		export type Any<G extends GrammarContext> = V.Modifier.Visibility<G> | V.Modifier.Visibility.Pub<G>;
	}
	export type Any<G extends GrammarContext> =
		| V.Modifier.Extern<G>
		| V.Modifier.Visibility<G>
		| V.Modifier.Visibility.Pub<G>;
}
