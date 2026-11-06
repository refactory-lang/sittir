import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export namespace Integer {
			export interface Big<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer<G>> {
				// claimed by pt
				readonly $kind: 'literal.number.integer.big';
				readonly $value: bigint;
			}
			export namespace Big {
				export interface Binary<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer.Big<G>, 'content'> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.binary';
					readonly content: Slot<G, 'literal.number.integer.big.binary', 'content', unknown>;
				}
				export interface Hex<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer.Big<G>, 'content'> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.hex';
					readonly content: Slot<G, 'literal.number.integer.big.hex', 'content', unknown>;
				}
				export interface Octal<G extends GrammarMap> extends SubKindOf<V.Literal.Number.Integer.Big<G>, 'content'> {
					// claimed by t
					readonly $kind: 'literal.number.integer.big.octal';
					readonly content: Slot<G, 'literal.number.integer.big.octal', 'content', unknown>;
				}
			}
		}
	}
}
