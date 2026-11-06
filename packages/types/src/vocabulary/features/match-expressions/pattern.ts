import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface As<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.as';
		readonly name: Slot<G, 'pattern.as', 'name', V.Identifier.Any<G>>;
		readonly pattern: Slot<G, 'pattern.as', 'pattern', unknown>;
	}
	export interface Map<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by p
		readonly $kind: 'pattern.map';
		readonly elements?: Slot<G, 'pattern.map', 'elements', unknown>[];
	}
	export interface Or<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by pr
		readonly $kind: 'pattern.or';
		readonly left?: Slot<
			G,
			'pattern.or',
			'left',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>;
		readonly right: Slot<
			G,
			'pattern.or',
			'right',
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Type.Primitive<G>
		>;
	}
}
