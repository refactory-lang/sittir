import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export namespace Bounds {
		export interface HigherRanked<G extends GrammarMap> extends SubKindOf<V.Clause.Bounds<G>> {
			// claimed by r
			readonly $kind: 'clause.bounds.higher_ranked';
			readonly type: Slot<
				G,
				'clause.bounds.higher_ranked',
				'type',
				| V.Clause.Bounds.Removed<G>
				| V.Expression.Call.Macro<G>
				| V.Identifier.Any<G>
				| V.Type.Any<G>
			>;
			readonly typeParameters: (
				| V.Identifier.Metavariable<G>
				| V.Declaration.TypeParameter<G>
				| V.Declaration.TypeParameter.Lifetime<G>
				| V.Declaration.TypeParameter.Value<G>
			)[];
		}
	}
}
