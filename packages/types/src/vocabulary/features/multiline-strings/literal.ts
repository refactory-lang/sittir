import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.multiline'> = 'literal.string.multiline'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
		}
	}
}
