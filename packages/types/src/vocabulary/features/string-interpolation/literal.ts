import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Interpolated<G extends GrammarMap, K extends Under<'literal.string.interpolated'> = 'literal.string.interpolated'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by pt
			readonly $path: K;
		}
	}
}
