import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Attribute {
	export interface Decorator<G extends GrammarMap, K extends Under<'attribute.decorator'> = 'attribute.decorator'> extends SubKindOf<V.Attribute<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly content: Slot<
			G,
			K,
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
