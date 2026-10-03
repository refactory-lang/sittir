// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type { Simplify } from 'type-fest';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarContext> {
	// claimed by r
	readonly kind: 'attribute';
	readonly content?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | V.Attribute.Content.Any<G>;
	// prt only
}

export namespace Attribute {
	export interface Content<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute<G>>> {
		// claimed by r
		readonly kind: 'attribute.content';
		readonly input?: V.Unmapped<'rust:attribute_input'>;
		// unmapped: <rust:attribute_input>
		readonly path?:
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
	export namespace Content {
		export interface Call<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute.Content<G>>> {
			// claimed by t
			readonly kind: 'attribute.content.call';
			readonly arguments: (
				| V.Declaration.Module<G>
				| V.Element.Splat<G>
				| G['expression']
				| G['identifier']
				| G['literal']
			)[];
			readonly function: V.Attribute.Content.Member<G> | G['identifier'];
			readonly typeArguments?: (G['identifier'] | G['type'])[];
		}
		export interface Member<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute.Content<G>>> {
			// claimed by t
			readonly kind: 'attribute.content.member';
			readonly object: V.Attribute.Content.Member<G> | G['identifier'];
			readonly property: V.Identifier.Property<G>;
		}
		export interface Parenthesized<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute.Content<G>>> {
			// claimed by t
			readonly kind: 'attribute.content.parenthesized';
			readonly expression: G['identifier'] | V.Attribute.Content.Any<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Attribute.Content<G>
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Attribute.Content.Parenthesized<G>;
	}
	export interface Decorator<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute<G>>> {
		// claimed by pt
		readonly kind: 'attribute.decorator';
		readonly content: G['expression'] | G['identifier'] | G['literal'] | G['pattern'] | V.Attribute.Content.Any<G>;
	}
	export interface Inner<G extends GrammarContext> extends Simplify<SubKindOf<V.Attribute<G>>> {
		// claimed by r
		readonly kind: 'attribute.inner';
		readonly content: V.Attribute.Content<G>;
	}
	export type Any<G extends GrammarContext> =
		| V.Attribute<G>
		| V.Attribute.Content<G>
		| V.Attribute.Content.Call<G>
		| V.Attribute.Content.Member<G>
		| V.Attribute.Content.Parenthesized<G>
		| V.Attribute.Decorator<G>
		| V.Attribute.Inner<G>;
}
