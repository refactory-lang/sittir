import type { GrammarMap, Slot } from '../../../../map.ts';
import type { SubKindOf, Under } from '../../../../utils.ts';
import type * as V from '../../../../index.ts';
export namespace Clause {
	export interface Bounds<G extends GrammarMap, K extends Under<'clause.bounds'> = 'clause.bounds'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by rt
		readonly $path: K;
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
}
