import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Reference<G extends GrammarMap, K extends Under<'pattern.reference'> = 'pattern.reference'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly pattern: Slot<G, 'pattern.reference', 'pattern', unknown>;
	}
	export namespace Reference {
		export interface Value<G extends GrammarMap, K extends Under<'pattern.reference.value'> = 'pattern.reference.value'> extends SubKindOf<V.Pattern.Reference<G, K>, 'pattern'> {
			// claimed by r
			readonly $kind: K;
			readonly exclusive?: Flag;
			readonly pattern: Slot<G, 'pattern.reference.value', 'pattern', unknown>;
		}
	}
}
