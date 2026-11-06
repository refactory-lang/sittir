import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Bounds<G extends GrammarMap, K extends Under<'clause.bounds'> = 'clause.bounds'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by rt
		readonly $kind: K;
		readonly bounds?: Slot<
			G,
			K,
			'bounds',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace Bounds {
		export interface Removed<G extends GrammarMap, K extends Under<'clause.bounds.removed'> = 'clause.bounds.removed'> extends SubKindOf<V.Clause.Bounds<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly type: Slot<
				G,
				K,
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
		export interface Use<G extends GrammarMap, K extends Under<'clause.bounds.use'> = 'clause.bounds.use'> extends SubKindOf<V.Clause.Bounds<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly bounds?: Slot<G, K, 'bounds', V.Identifier.Any<G>>[];
		}
	}
	export interface Where<G extends GrammarMap, K extends Under<'clause.where'> = 'clause.where'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly wherePredicates?: Slot<G, K, 'wherePredicates', V.Clause.Where.Predicate<G>>[];
	}
	export namespace Where {
		export interface Predicate<G extends GrammarMap, K extends Under<'clause.where.predicate'> = 'clause.where.predicate'> extends SubKindOf<V.Clause.Where<G, K>> {
			// claimed by r
			readonly $kind: K;
			readonly bounds: Slot<
				G,
				K,
				'bounds',
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
				| V.Type.Any<G>
			>[];
			readonly left: Slot<
				G,
				K,
				'left',
				| V.Clause.Bounds.HigherRanked<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
