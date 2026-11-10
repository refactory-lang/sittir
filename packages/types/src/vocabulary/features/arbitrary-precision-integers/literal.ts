import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Number {
		export namespace Integer {
			export interface Big<G extends GrammarMap, K extends Under<'literal.number.integer.big'> = 'literal.number.integer.big'> extends SubKindOf<V.Literal.Number.Integer<G, K>> {
				// claimed by pt
				readonly $path: K;
				readonly $value: bigint;
			}
		}
	}
}
