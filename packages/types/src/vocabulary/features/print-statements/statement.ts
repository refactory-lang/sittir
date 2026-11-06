import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Print<G extends GrammarMap, K extends Under<'statement.print'> = 'statement.print'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $path: K;
		readonly arguments?: Slot<
			G,
			K,
			'arguments',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>[];
		readonly destination?: Slot<
			G,
			K,
			'destination',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly trailingComma?: Flag;
	}
}
