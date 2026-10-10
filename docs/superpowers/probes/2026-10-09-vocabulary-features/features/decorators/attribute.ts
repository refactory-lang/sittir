import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export namespace Content {
		export interface Call<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			readonly $kind: 'attribute.content.call';
			readonly arguments: G['slots']['attribute.content.call']['arguments'][];
			readonly function: G['slots']['attribute.content.call']['function'];
			readonly typeArguments?: G['slots']['attribute.content.call']['typeArguments'][];
		}
		export interface Member<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			readonly $kind: 'attribute.content.member';
			readonly object: G['slots']['attribute.content.member']['object'];
			readonly property: V.Identifier.Property<G>;
		}
		export interface Parenthesized<G extends GrammarContext> extends SubKindOf<V.Attribute.Content<G>> {
			readonly $kind: 'attribute.content.parenthesized';
			readonly expression: G['slots']['attribute.content.parenthesized']['expression'];
		}
	}
	export interface Decorator<G extends GrammarContext> extends SubKindOf<V.Attribute<G>> {
		readonly $kind: 'attribute.decorator';
		readonly content: G['slots']['attribute.decorator']['content'];
	}
}
