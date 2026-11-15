import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> {
		readonly decorators?: Slot<G, K, 'decorators', V.Expression.Any<G> | V.Identifier.Any<G> | V.Literal.Any<G> | V.Pattern.Any<G> | V.Attribute.Content.Call<G> | V.Attribute.Content.Member<G> | V.Attribute.Content.Parenthesized<G>>[];
		// p only
	}
}
