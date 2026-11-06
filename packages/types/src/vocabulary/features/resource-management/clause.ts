import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Resource<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by p
		readonly $kind: 'clause.resource';
		readonly items: V.Clause.Resource.Item<G>[];
	}
	export namespace Resource {
		export interface Item<G extends GrammarMap> extends SubKindOf<V.Clause.Resource<G>> {
			// claimed by p
			readonly $kind: 'clause.resource.item';
			readonly name?: Slot<
				G,
				'clause.resource.item',
				'name',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Pattern.Any<G>
				| V.Literal.Any<G>
			>;
			readonly value: Slot<
				G,
				'clause.resource.item',
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Any<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
