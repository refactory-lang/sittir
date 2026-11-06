import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export namespace Bytes {
			export interface Raw<G extends GrammarMap> extends SubKindOf<V.Literal.String.Bytes<G>> {
				// claimed by pr
				readonly $kind: 'literal.string.bytes.raw';
				readonly content?: Slot<G, 'literal.string.bytes.raw', 'content', V.Literal.String.Text<G>>;
				// r only
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Bytes.Raw<G>> {
					// claimed by p
					readonly $kind: 'literal.string.bytes.raw.multiline';
				}
			}
		}
		export namespace Interpolated {
			export namespace Deferred {
				export interface Raw<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated.Deferred<G>> {
					// claimed by p
					readonly $kind: 'literal.string.interpolated.deferred.raw';
				}
				export namespace Raw {
					export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated.Deferred.Raw<G>> {
						// claimed by p
						readonly $kind: 'literal.string.interpolated.deferred.raw.multiline';
					}
				}
			}
			export interface Raw<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated<G>> {
				// claimed by p
				readonly $kind: 'literal.string.interpolated.raw';
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Interpolated.Raw<G>> {
					// claimed by p
					readonly $kind: 'literal.string.interpolated.raw.multiline';
				}
			}
		}
		export interface Raw<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by pr
			readonly $kind: 'literal.string.raw';
			readonly content: Slot<G, 'literal.string.raw', 'content', V.Literal.String.Text<G>>;
			// r only
		}
		export namespace Raw {
			export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Raw<G>> {
				// claimed by p
				readonly $kind: 'literal.string.raw.multiline';
			}
		}
	}
}
