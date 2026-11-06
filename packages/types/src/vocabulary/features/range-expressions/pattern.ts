import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Pattern {
	export interface Range<G extends GrammarMap, K extends Under<'pattern.range'> = 'pattern.range'> extends SubKindOf<V.Pattern<G, K>> {
		// claimed by r
		readonly $kind: K;
		readonly left?: Slot<G, 'pattern.range', 'left', V.Identifier.Any<G> | V.Literal.Any<G> | string>;
		readonly right?: Slot<G, 'pattern.range', 'right', V.Identifier.Any<G> | V.Literal.Any<G> | string>;
	}
	export namespace Range {
		export interface Exclusive<G extends GrammarMap, K extends Under<'pattern.range.exclusive'> = 'pattern.range.exclusive'> extends SubKindOf<V.Pattern.Range<G, K>> {
			// claimed by r
			readonly $kind: K;
		}
		export interface Inclusive<G extends GrammarMap, K extends Under<'pattern.range.inclusive'> = 'pattern.range.inclusive'> extends SubKindOf<V.Pattern.Range<G, K>> {
			// claimed by r
			readonly $kind: K;
		}
		export namespace Inclusive {
			export interface Legacy<G extends GrammarMap, K extends Under<'pattern.range.inclusive.legacy'> = 'pattern.range.inclusive.legacy'> extends SubKindOf<V.Pattern.Range.Inclusive<G, K>> {
				// claimed by r
				readonly $kind: K;
			}
		}
	}
}
