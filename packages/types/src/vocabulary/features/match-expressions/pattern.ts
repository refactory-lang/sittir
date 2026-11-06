import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface As<G extends GrammarMap, K extends Under<'pattern.as'> = 'pattern.as'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pr
		readonly $kind: K;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly pattern: Slot<G, K, 'pattern', unknown>;
	}
	export interface Map<G extends GrammarMap, K extends Under<'pattern.map'> = 'pattern.map'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by p
		readonly $kind: K;
		readonly elements?: Slot<G, K, 'elements', unknown>[];
	}
	export interface Or<G extends GrammarMap, K extends Under<'pattern.or'> = 'pattern.or'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by pr
		readonly $kind: K;
		readonly left?: Slot<
			G,
			K,
			'left',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly right: Slot<
			G,
			K,
			'right',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>;
	}
}
