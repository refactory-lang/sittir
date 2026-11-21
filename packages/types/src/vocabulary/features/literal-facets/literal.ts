import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export interface Null<G extends GrammarMap, K extends Under<'literal.null'> = 'literal.null'> extends SubKindOf<V.Literal<G, K>> {
		// claimed by pt
		readonly $path: K;
	}
	export namespace Number {
		export namespace Float {
			export interface LeadingPoint<G extends GrammarMap, K extends Under<'literal.number.float.leading_point'> = 'literal.number.float.leading_point'> extends SubKindOf<V.Literal.Number.Float<G, K>> {
				// claimed by pt
				readonly $path: K;
			}
			export interface Scientific<G extends GrammarMap, K extends Under<'literal.number.float.scientific'> = 'literal.number.float.scientific'> extends SubKindOf<V.Literal.Number.Float<G, K>> {
				// claimed by pt
				readonly $path: K;
			}
		}
	}
}
