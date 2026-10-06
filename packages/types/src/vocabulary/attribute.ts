import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Attribute<G extends GrammarContext> {
	// claimed by r
	readonly $kind: 'attribute';
	readonly content?: G['slots']['attribute']['content'];
	// prt only
}

export namespace Attribute {
	export interface Content<G extends GrammarContext> extends SubKindOf<V.Attribute<G>> {
		// claimed by r
		readonly $kind: 'attribute.content';
		readonly input?: G['slots']['attribute.content']['input'];
		readonly path?: G['identifier'];
	}
	export namespace Content {
		export interface Call<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.call';
			readonly arguments: G['slots']['attribute.content.call']['arguments'][];
			readonly function: G['slots']['attribute.content.call']['function'];
			readonly typeArguments?: G['slots']['attribute.content.call']['typeArguments'][];
		}
		export interface Member<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.member';
			readonly object: G['slots']['attribute.content.member']['object'];
			readonly property: V.Identifier.Property<G>;
		}
		export interface Parenthesized<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.parenthesized';
			readonly expression: G['slots']['attribute.content.parenthesized']['expression'];
		}
		export type Any<G extends GrammarContext> =
			| V.Attribute.Content<G>
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Attribute.Content.Parenthesized<G>;
	}
	export interface Decorator<G extends GrammarContext> extends SubKindOf<V.Attribute<G>> {
		// claimed by pt
		readonly $kind: 'attribute.decorator';
		readonly content: G['slots']['attribute.decorator']['content'];
	}
	export interface Inner<G extends GrammarContext> extends SubKindOf<V.Attribute<G>> {
		// claimed by r
		readonly $kind: 'attribute.inner';
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
