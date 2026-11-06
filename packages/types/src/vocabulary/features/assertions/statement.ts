import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Assert<G extends GrammarMap, K extends Under<'statement.assert'> = 'statement.assert'> extends SubKindOf<V.Statement<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly expressions: Slot<
			G,
			K,
			'expressions',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>[];
	}
}
