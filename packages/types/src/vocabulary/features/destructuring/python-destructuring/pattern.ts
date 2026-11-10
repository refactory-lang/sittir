import type { GrammarMap } from '../../../map.ts';
import type { Flag, SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Pattern {
	export namespace Rest {
		export interface Map<G extends GrammarMap, K extends Under<'pattern.rest.map'> = 'pattern.rest.map'> extends SubKindOf<V.Pattern.Rest<G, K>> {
			// claimed by p
			readonly $path: K;
		}
	}
	export namespace Tuple {
		export interface Bare<G extends GrammarMap, K extends Under<'pattern.tuple.bare'> = 'pattern.tuple.bare'> extends SubKindOf<V.Pattern.Tuple<G, K>> {
			// claimed by p
			readonly $path: K;
			readonly trailingComma?: Flag;
		}
	}
}
