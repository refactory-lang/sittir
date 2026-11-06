import type { GrammarMap, Slot } from '../../map.ts';
import type { Under } from '../../utils.ts';
export namespace Literal {
	export namespace Number {
		export interface Integer<G extends GrammarMap, K extends Under<'literal.number.integer'> = 'literal.number.integer'> {
			readonly suffix?: Slot<G, K, 'suffix', string>;
			// r only
		}
		export namespace Integer {
			export interface Binary<G extends GrammarMap, K extends Under<'literal.number.integer.binary'> = 'literal.number.integer.binary'> {
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
			export interface Hex<G extends GrammarMap, K extends Under<'literal.number.integer.hex'> = 'literal.number.integer.hex'> {
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
			export interface Octal<G extends GrammarMap, K extends Under<'literal.number.integer.octal'> = 'literal.number.integer.octal'> {
				readonly suffix?: Slot<G, K, 'suffix', string>;
				// r only
			}
		}
	}
}
