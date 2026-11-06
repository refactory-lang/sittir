import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Interpolated<G extends GrammarMap, K extends Under<'literal.string.interpolated'> = 'literal.string.interpolated'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by pt
			readonly $kind: K;
		}
		export namespace Interpolated {
			export interface Deferred<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred'> = 'literal.string.interpolated.deferred'> extends SubKindOf<V.Literal.String.Interpolated<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
			export namespace Deferred {
				export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred.multiline'> = 'literal.string.interpolated.deferred.multiline'> extends SubKindOf<V.Literal.String.Interpolated.Deferred<G, K>> {
					// claimed by p
					readonly $kind: K;
				}
			}
			export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.multiline'> = 'literal.string.interpolated.multiline'> extends SubKindOf<V.Literal.String.Interpolated<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
		}
	}
}
