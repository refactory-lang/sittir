import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Range<G extends GrammarMap> extends SubKindOf<V.Pattern<G>> {
		// claimed by r
		readonly $kind: 'pattern.range';
		readonly left?: Slot<G, 'pattern.range', 'left', V.Identifier.Any<G> | V.Literal.Any<G> | string>;
		readonly right?: Slot<G, 'pattern.range', 'right', V.Identifier.Any<G> | V.Literal.Any<G> | string>;
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarMap> extends SubKindOf<V.Pattern.Range<G>> {
			// claimed by r
			readonly $kind: 'pattern.range.exclusive';
		}
		export interface Inclusive<G extends GrammarMap> extends SubKindOf<V.Pattern.Range<G>> {
			// claimed by r
			readonly $kind: 'pattern.range.inclusive';
		}
		export namespace Inclusive {
			export interface Legacy<G extends GrammarMap> extends SubKindOf<V.Pattern.Range.Inclusive<G>> {
				// claimed by r
				readonly $kind: 'pattern.range.inclusive.legacy';
			}
		}
	}
}
