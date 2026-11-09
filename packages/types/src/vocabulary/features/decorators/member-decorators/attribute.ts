import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Attribute {
	export namespace Content {
		export interface Call<G extends GrammarMap, K extends Under<'attribute.content.call'> = 'attribute.content.call'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly arguments: Slot<
				G,
				K,
				'arguments',
				| V.Declaration.Module<G>
				| V.Element.Spread<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
			>[];
			readonly function: Slot<G, K, 'function', V.Attribute.Content.Member<G> | V.Identifier.Any<G>>;
			readonly typeArguments?: Slot<G, K, 'typeArguments', V.Identifier.Any<G> | V.Type.Any<G>>[];
		}
		export interface Member<G extends GrammarMap, K extends Under<'attribute.content.member'> = 'attribute.content.member'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly object: Slot<G, K, 'object', V.Attribute.Content.Member<G> | V.Identifier.Any<G>>;
			readonly property: Slot<G, K, 'property', V.Identifier.Any<G>>;
		}
		export interface Parenthesized<G extends GrammarMap, K extends Under<'attribute.content.parenthesized'> = 'attribute.content.parenthesized'> extends SubKindOf<V.Attribute.Content<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly expression: Slot<
				G,
				K,
				'expression',
				| V.Identifier.Any<G>
				| V.Attribute.Content.Call<G>
				| V.Attribute.Content.Member<G>
			>;
		}
	}
}
