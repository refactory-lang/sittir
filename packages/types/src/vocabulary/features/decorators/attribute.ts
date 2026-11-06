import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export namespace Content {
		export interface Call<G extends GrammarMap, K extends Under<'attribute.content.call'> = 'attribute.content.call'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly arguments: Slot<
				G,
				'attribute.content.call',
				'arguments',
				| V.Declaration.Module<G>
				| V.Element.Spread<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>[];
			readonly function: Slot<G, 'attribute.content.call', 'function', V.Attribute.Content.Member<G> | V.Identifier.Any<G>>;
			readonly typeArguments?: Slot<G, 'attribute.content.call', 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		}
		export interface Member<G extends GrammarMap, K extends Under<'attribute.content.member'> = 'attribute.content.member'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly object: Slot<G, 'attribute.content.member', 'object', V.Attribute.Content.Member<G> | V.Identifier.Any<G>>;
			readonly property: V.Identifier<G>;
		}
		export interface Parenthesized<G extends GrammarMap, K extends Under<'attribute.content.parenthesized'> = 'attribute.content.parenthesized'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $kind: K;
			readonly expression: Slot<
				G,
				'attribute.content.parenthesized',
				'expression',
				| V.Identifier.Any<G>
				| V.Attribute.Content.Call<G>
				| V.Attribute.Content.Member<G>
			>;
		}
	}
	export interface Decorator<G extends GrammarMap, K extends Under<'attribute.decorator'> = 'attribute.decorator'> extends SubKindOf<V.Attribute<G, K>, 'content'> {
		// claimed by pt
		readonly $kind: K;
		readonly content: Slot<
			G,
			'attribute.decorator',
			'content',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Attribute.Content.Call<G>
			| V.Attribute.Content.Member<G>
			| V.Attribute.Content.Parenthesized<G>
		>;
	}
}
