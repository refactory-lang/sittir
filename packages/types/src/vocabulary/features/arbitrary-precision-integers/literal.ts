import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export namespace Integer {
			export interface Big<G extends GrammarMap, K extends Under<'literal.number.integer.big'> = 'literal.number.integer.big'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by pt
				readonly $kind: K;
				readonly $value: bigint;
			}
			export namespace Big {
				export interface Binary<G extends GrammarMap, K extends Under<'literal.number.integer.big.binary'> = 'literal.number.integer.big.binary'> extends SubKindOf<V.Literal.Number.Integer.Big<G, K>> {
					// claimed by t
					readonly $kind: K;
					readonly content: Slot<G, K, 'content', unknown>;
				}
				export interface Hex<G extends GrammarMap, K extends Under<'literal.number.integer.big.hex'> = 'literal.number.integer.big.hex'> extends SubKindOf<V.Literal.Number.Integer.Big<G, K>> {
					// claimed by t
					readonly $kind: K;
					readonly content: Slot<G, K, 'content', unknown>;
				}
				export interface Octal<G extends GrammarMap, K extends Under<'literal.number.integer.big.octal'> = 'literal.number.integer.big.octal'> extends SubKindOf<V.Literal.Number.Integer.Big<G, K>> {
					// claimed by t
					readonly $kind: K;
					readonly content: Slot<G, K, 'content', unknown>;
				}
			}
		}
	}
}
