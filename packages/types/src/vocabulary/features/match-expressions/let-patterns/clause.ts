import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Let<G extends GrammarMap, K extends Under<'clause.let'> = 'clause.let'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by r
		readonly $path: K;
		readonly pattern?: Slot<G, K, 'pattern', unknown>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Statement.Any<G>
		>;
	}
	export namespace Let {
		export interface Chain<G extends GrammarMap, K extends Under<'clause.let.chain'> = 'clause.let.chain'> extends SubKindOf<V.Clause.Let<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly left: Slot<
				G,
				K,
				'left',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Clause.Let.Any<G>
				| V.Statement.Any<G>
			>;
			readonly rights?: Slot<
				G,
				K,
				'rights',
				| V.Clause.Let<G>
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Statement.Any<G>
			>[];
		}
	}
}
