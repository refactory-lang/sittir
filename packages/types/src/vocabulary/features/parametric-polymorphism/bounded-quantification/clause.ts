import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Clause {
	export interface Bounds<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by rt
		readonly $kind: 'clause.bounds';
		readonly bounds?: Slot<
			G,
			'clause.bounds',
			'bounds',
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Clause.Bounds.HigherRanked<G>
			| V.Clause.Bounds.Removed<G>
			| V.Type.Any<G>
		>[];
	}
	export namespace Bounds {
		export interface Removed<G extends GrammarMap> extends SubKindOf<V.Clause.Bounds<G>> {
			// claimed by r
			readonly $kind: 'clause.bounds.removed';
			readonly type: Slot<
				G,
				'clause.bounds.removed',
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
		export interface Use<G extends GrammarMap> extends SubKindOf<V.Clause.Bounds<G>, 'bounds'> {
			// claimed by r
			readonly $kind: 'clause.bounds.use';
			readonly bounds?: Slot<G, 'clause.bounds.use', 'bounds', V.Identifier.Any<G>>[];
		}
	}
	export interface Where<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by r
		readonly $kind: 'clause.where';
		readonly wherePredicates?: V.Clause.Where.Predicate<G>[];
	}
	export namespace Where {
		export interface Predicate<G extends GrammarMap> extends SubKindOf<V.Clause.Where<G>> {
			// claimed by r
			readonly $kind: 'clause.where.predicate';
			readonly bounds: Slot<
				G,
				'clause.where.predicate',
				'bounds',
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Clause.Bounds.HigherRanked<G>
				| V.Clause.Bounds.Removed<G>
				| V.Type.Any<G>
			>[];
			readonly left: Slot<
				G,
				'clause.where.predicate',
				'left',
				| V.Clause.Bounds.HigherRanked<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
		}
	}
}
