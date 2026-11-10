import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Pattern {
	export interface Tuple<G extends GrammarMap, K extends Under<'pattern.tuple'> = 'pattern.tuple'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pr
		readonly $path: K;
		readonly elements?: Slot<
			G,
			K,
			'elements',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>[];
	}
}
