// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type * as V from './index.ts';

export interface Attribute<G extends GrammarContext> {
	// claimed by r
	readonly kind: 'attribute';
	readonly content?: G['identifier'] | V.Attribute.Content.Any<G>;
	// rt only
}

export namespace Attribute {
	export interface Content<G extends GrammarContext> extends V.Attribute<G> {
		// claimed by r
		readonly kind: 'attribute.content';
		readonly input?: V.Unmapped<'rust:attribute_input'>;
		// unmapped: <rust:attribute_input>
		readonly path?: G['identifier'];
	}
	export namespace Content {
		export interface Call<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly kind: 'attribute.content.call';
			readonly arguments: (G['expression'] | G['element'])[];
			readonly function: V.Attribute.Content.Member<G> | G['identifier'];
			readonly typeArguments?: G['type'][];
		}
		export interface Member<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly kind: 'attribute.content.member';
			readonly object: V.Attribute.Content.Member<G> | G['identifier'];
			readonly property: G['identifier'];
		}
		export interface Parenthesized<G extends GrammarContext> extends V.Attribute.Content<G> {
			// claimed by t
			readonly kind: 'attribute.content.parenthesized';
			readonly content: G['identifier'] | V.Attribute.Content.Any<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Attribute.Content<G>
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Attribute.Content.Parenthesized<G>;
	}
	export interface Decorator<G extends GrammarContext> extends V.Attribute<G> {
		// claimed by pt
		readonly kind: 'attribute.decorator';
		readonly content?: G['identifier'] | V.Attribute.Content.Any<G>;
		// t only
		readonly expression?: G['expression'] | G['identifier'] | G['literal'] | G['pattern'];
		// p only
	}
	export interface Inner<G extends GrammarContext> extends V.Attribute<G> {
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
