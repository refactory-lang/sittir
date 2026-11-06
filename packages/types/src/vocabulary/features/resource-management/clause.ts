import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Resource<G extends GrammarMap, K extends Under<'clause.resource'> = 'clause.resource'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly items: Slot<G, K, 'items', V.Clause.Resource.Item<G>>[];
	}
	export namespace Resource {
		export interface Item<G extends GrammarMap, K extends Under<'clause.resource.item'> = 'clause.resource.item'> extends SubKindOf<V.Clause.Resource<G, K>> {
			// claimed by p
			readonly $kind: K;
			readonly name?: Slot<
				G,
				K,
				'name',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Pattern.Any<G>
				| V.Literal.Any<G>
			>;
			readonly value: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
