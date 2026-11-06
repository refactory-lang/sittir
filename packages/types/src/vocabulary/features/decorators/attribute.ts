import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export namespace Content {
		export interface Call<G extends GrammarMap> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.call';
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
		export interface Member<G extends GrammarMap> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.member';
			readonly object: Slot<G, 'attribute.content.member', 'object', V.Attribute.Content.Member<G> | V.Identifier.Any<G>>;
			readonly property: V.Identifier<G>;
		}
		export interface Parenthesized<G extends GrammarMap> extends SubKindOf<V.Attribute.Content<G>> {
			// claimed by t
			readonly $kind: 'attribute.content.parenthesized';
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
	export interface Decorator<G extends GrammarMap> extends SubKindOf<V.Attribute<G>, 'content'> {
		// claimed by pt
		readonly $kind: 'attribute.decorator';
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
