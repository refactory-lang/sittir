import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Interpolated<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by pt
			readonly $kind: 'literal.string.interpolated';
		}
		export namespace Interpolated {
			export interface Deferred<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated<G>> {
				// claimed by p
				readonly $kind: 'literal.string.interpolated.deferred';
			}
			export namespace Deferred {
				export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated.Deferred<G>> {
					// claimed by p
					readonly $kind: 'literal.string.interpolated.deferred.multiline';
				}
			}
			export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated<G>> {
				// claimed by p
				readonly $kind: 'literal.string.interpolated.multiline';
			}
		}
	}
}
