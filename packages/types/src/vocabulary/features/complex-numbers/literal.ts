import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export interface Float<G extends GrammarMap, K extends Under<'literal.number.float'> = 'literal.number.float'> {
			readonly imaginary?: Slot<G, K, 'imaginary', unknown>;
			// p only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> {
				readonly imaginary?: Slot<G, K, 'imaginary', unknown>;
				// p only
			}
			export interface Scientific<G extends GrammarMap, K extends Under<'literal.number.float.scientific'> = 'literal.number.float.scientific'> {
				readonly imaginary?: Slot<G, K, 'imaginary', unknown>;
				// p only
			}
		}
		export namespace Integer {
			export interface Imaginary<G extends GrammarMap, K extends Under<'literal.number.integer.imaginary'> = 'literal.number.integer.imaginary'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
		}
	}
}
