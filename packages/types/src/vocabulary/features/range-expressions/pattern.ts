import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Range<G extends GrammarContext<G>> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.range';
		readonly left?: G['slots']['pattern.range']['left'];
		readonly right?: G['slots']['pattern.range']['right'];
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Range<G>> {
			// claimed by r
			readonly $kind: 'pattern.range.exclusive';
		}
		export interface Inclusive<G extends GrammarContext<G>> extends SubKindOf<V.Pattern.Range<G>> {
			// claimed by r
			readonly $kind: 'pattern.range.inclusive';
		}
	}
}
