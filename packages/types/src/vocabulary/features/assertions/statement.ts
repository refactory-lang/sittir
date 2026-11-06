import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Assert<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.assert';
		readonly expressions: Slot<
			G,
			'statement.assert',
			'expressions',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>[];
	}
}
