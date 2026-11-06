import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Argument {
	export interface Named<G extends GrammarMap, K extends Under<'argument.named'> = 'argument.named'> extends SubKindOf<V.Argument<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly value: Slot<
			G,
			K,
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
