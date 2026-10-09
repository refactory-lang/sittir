import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export namespace Integer {
			export interface Big<G extends GrammarContext> extends SubKindOf<V.Literal.Number.Integer<G>> {
				readonly $kind: 'literal.number.integer.big';
			}
			export namespace Big {
				export interface Binary<G extends GrammarContext> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					readonly $kind: 'literal.number.integer.big.binary';
					readonly content: G['slots']['literal.number.integer.big.binary']['content'];
				}
				export interface Hex<G extends GrammarContext> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					readonly $kind: 'literal.number.integer.big.hex';
					readonly content: G['slots']['literal.number.integer.big.hex']['content'];
				}
				export interface Octal<G extends GrammarContext> extends SubKindOf<V.Literal.Number.Integer.Big<G>> {
					readonly $kind: 'literal.number.integer.big.octal';
					readonly content: G['slots']['literal.number.integer.big.octal']['content'];
				}
			}
		}
	}
}
