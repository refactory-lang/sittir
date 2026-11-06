import type { GrammarMap, Slot } from '../../map.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Reference<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.reference';
		readonly pattern: Slot<G, 'pattern.reference', 'pattern', unknown>;
	}
	export namespace Reference {
		export interface Value<G extends GrammarMap> extends SubKindOf<V.Pattern.Reference<G>, 'pattern'> {
			// claimed by r
			readonly $kind: 'pattern.reference.value';
			readonly exclusive?: Flag;
			readonly pattern: Slot<G, 'pattern.reference.value', 'pattern', unknown>;
		}
	}
}
