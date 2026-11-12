import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Literal {
	export namespace String {
		export namespace Bytes {
			export namespace Raw {
				export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.bytes.raw.multiline'> = 'literal.string.bytes.raw.multiline'> extends SubKindOf<V.Literal.String.Bytes.Raw<G, K>> {
					// claimed by p
					readonly $path: K;
				}
			}
		}
		export namespace Interpolated {
			export namespace Deferred {
				export interface Raw<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred.raw'> = 'literal.string.interpolated.deferred.raw'> extends SubKindOf<V.Literal.String.Interpolated.Deferred<G, K>> {
					// claimed by p
					readonly $path: K;
				}
				export namespace Raw {
					export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred.raw.multiline'> = 'literal.string.interpolated.deferred.raw.multiline'> extends SubKindOf<V.Literal.String.Interpolated.Deferred.Raw<G, K>> {
						// claimed by p
						readonly $path: K;
					}
				}
			}
			export interface Raw<G extends GrammarMap, K extends Under<'literal.string.interpolated.raw'> = 'literal.string.interpolated.raw'> extends SubKindOf<V.Literal.String.Interpolated<G, K>> {
				// claimed by p
				readonly $path: K;
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.raw.multiline'> = 'literal.string.interpolated.raw.multiline'> extends SubKindOf<V.Literal.String.Interpolated.Raw<G, K>> {
					// claimed by p
					readonly $path: K;
				}
			}
		}
		export namespace Raw {
			export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.raw.multiline'> = 'literal.string.raw.multiline'> extends SubKindOf<V.Literal.String.Raw<G, K>> {
				// claimed by p
				readonly $path: K;
			}
		}
	}
}
