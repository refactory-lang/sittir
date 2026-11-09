import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Unicode<G extends GrammarMap, K extends Under<'literal.string.unicode'> = 'literal.string.unicode'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
		}
	}
}
