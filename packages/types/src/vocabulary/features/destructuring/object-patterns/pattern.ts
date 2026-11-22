import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Pattern {
	export interface Assignment<G extends GrammarMap, K extends Under<'pattern.assignment'> = 'pattern.assignment'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly left: Slot<G, K, 'left', V.Pattern.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Expression.Any<G>>;
	}
	export interface Object<G extends GrammarMap, K extends Under<'pattern.object'> = 'pattern.object'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by t
		readonly $path: K;
		readonly properties?: Slot<G, K, 'properties', V.Pattern.Any<G> | string>[];
	}
	export namespace Object {
		export interface Assignment<G extends GrammarMap, K extends Under<'pattern.object.assignment'> = 'pattern.object.assignment'> extends SubKindOf<V.Pattern.Object<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly left: Slot<G, K, 'left', V.Pattern.Any<G> | string>;
			readonly right: Slot<G, K, 'right', V.Expression.Any<G>>;
		}
		export interface Pair<G extends GrammarMap, K extends Under<'pattern.object.pair'> = 'pattern.object.pair'> extends SubKindOf<V.Pattern.Object<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly key: Slot<G, K, 'key', V.Expression.Any<G> | string>;
			readonly value?: Slot<
				G,
				K,
				'value',
				| V.Expression.Any<G>
				| V.Identifier.Any<G>
				| V.Literal.Null.Undefined<G>
				| V.Pattern.Any<G>
			>;
		}
	}
}
