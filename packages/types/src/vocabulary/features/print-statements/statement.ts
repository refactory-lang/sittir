import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Statement {
	export interface Print<G extends GrammarMap> extends SubKindOf<V.Statement<G>> {
		// claimed by p
		readonly $kind: 'statement.print';
		readonly arguments?: Slot<
			G,
			'statement.print',
			'arguments',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>[];
		readonly destination?: Slot<
			G,
			'statement.print',
			'destination',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
		>;
		readonly trailingComma?: Flag;
	}
}
