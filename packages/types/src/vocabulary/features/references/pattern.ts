import type { GrammarContext } from '../../context.ts';
import type { Flag, SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Reference<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.reference';
		readonly pattern: G['slots']['pattern.reference']['pattern'];
	}
	export namespace Reference {
		export interface Value<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Reference<G>> {
			// claimed by r
			readonly $kind: 'pattern.reference.value';
			readonly exclusive?: Flag;
			readonly pattern: G['slots']['pattern.reference.value']['pattern'];
		}
	}
}
