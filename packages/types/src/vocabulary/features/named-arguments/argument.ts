import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Argument {
	export interface Named<G extends GrammarMap, K extends Under<'argument.named'> = 'argument.named'> extends SubKindOf<V.Argument<G, K>, 'value'> {
		// claimed by p
		readonly $kind: K;
		readonly name: Slot<G, 'argument.named', 'name', V.Identifier.Any<G>>;
		readonly value: Slot<
			G,
			'argument.named',
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
