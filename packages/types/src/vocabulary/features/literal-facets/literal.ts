import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Null<G extends GrammarMap, K extends Under<'literal.null'> = 'literal.null'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by pt
		readonly $path: K;
	}
	export namespace Number {
		export interface Float<G extends GrammarMap, K extends Under<'literal.number.float'> = 'literal.number.float'> {
			readonly exponent?: Slot<G, K, 'exponent', unknown>;
			// pt only
			readonly fraction?: Slot<G, K, 'fraction', unknown>;
			// pt only
			readonly integer?: Slot<G, K, 'integer', unknown>;
			// pt only
			readonly marker?: Slot<G, K, 'marker', string>;
			// pt only
			readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
			// t only
		}
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> extends SubKindOf<V.Literal.Number.Float<G, K>, 'exponentSign' | 'fraction' | 'integer'> {
				// claimed by pt
				readonly $path: K;
				readonly fraction: Slot<G, K, 'fraction', unknown>;
				readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
				// t only
			}
			export interface Scientific<G extends GrammarMap, K extends Under<'literal.number.float.scientific'> = 'literal.number.float.scientific'> extends SubKindOf<V.Literal.Number.Float<G, K>, 'exponent' | 'exponentSign' | 'integer' | 'marker'> {
				// claimed by pt
				readonly $path: K;
				readonly exponent: Slot<G, K, 'exponent', unknown>;
				readonly integer: Slot<G, K, 'integer', unknown>;
				readonly marker: Slot<G, K, 'marker', string>;
				readonly exponentSign?: Slot<G, K, 'exponentSign', string>;
				// t only
			}
		}
		export namespace Integer {
			export interface Binary<G extends GrammarMap, K extends Under<'literal.number.integer.binary'> = 'literal.number.integer.binary'> {
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
			}
			export interface Hex<G extends GrammarMap, K extends Under<'literal.number.integer.hex'> = 'literal.number.integer.hex'> {
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
			}
			export interface Octal<G extends GrammarMap, K extends Under<'literal.number.integer.octal'> = 'literal.number.integer.octal'> {
				readonly radixPrefix?: Slot<G, K, 'radixPrefix', string>;
				// pt only
			}
		}
	}
}
