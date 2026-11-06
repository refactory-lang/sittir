import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace Null {
		export interface Undefined<G extends GrammarMap, K extends Under<'literal.null.undefined'> = 'literal.null.undefined'> extends SubKindOf<V.Literal.Null<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
}
