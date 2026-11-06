import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export interface Float<G extends GrammarMap> {
			readonly imaginary?: Slot<G, 'literal.number.float', 'imaginary', unknown>;
			// p only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap> {
				readonly imaginary?: Slot<G, 'literal.number.float.leading_point', 'imaginary', unknown>;
				// p only
			}
			export interface Scientific<G extends GrammarMap> {
				readonly imaginary?: Slot<G, 'literal.number.float.scientific', 'imaginary', unknown>;
				// p only
			}
		}
		export namespace Integer {
			export interface Imaginary<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by p
				readonly $kind: 'literal.number.integer.imaginary';
			}
		}
	}
}
