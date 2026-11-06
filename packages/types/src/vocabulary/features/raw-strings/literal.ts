import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export namespace Bytes {
			export interface Raw<G extends GrammarMap, K extends Under<'literal.string.bytes.raw'> = 'literal.string.bytes.raw'> extends SubKindOf<V.Literal.String.Bytes<G, K>> {
				// claimed by pr
				readonly $kind: K;
				readonly content?: Slot<G, 'literal.string.bytes.raw', 'content', V.Literal.String.Text<G>>;
				// r only
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.bytes.raw.multiline'> = 'literal.string.bytes.raw.multiline'> extends SubKindOf<V.Literal.String.Bytes.Raw<G, K>> {
					// claimed by p
					readonly $kind: K;
				}
			}
		}
		export namespace Interpolated {
			export namespace Deferred {
				export interface Raw<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred.raw'> = 'literal.string.interpolated.deferred.raw'> extends SubKindOf<V.Literal.String.Interpolated.Deferred<G, K>> {
					// claimed by p
					readonly $kind: K;
				}
				export namespace Raw {
					export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.deferred.raw.multiline'> = 'literal.string.interpolated.deferred.raw.multiline'> extends SubKindOf<V.Literal.String.Interpolated.Deferred.Raw<G, K>> {
						// claimed by p
						readonly $kind: K;
					}
				}
			}
			export interface Raw<G extends GrammarMap, K extends Under<'literal.string.interpolated.raw'> = 'literal.string.interpolated.raw'> extends SubKindOf<V.Literal.String.Interpolated<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.interpolated.raw.multiline'> = 'literal.string.interpolated.raw.multiline'> extends SubKindOf<V.Literal.String.Interpolated.Raw<G, K>> {
					// claimed by p
					readonly $kind: K;
				}
			}
		}
		export interface Raw<G extends GrammarMap, K extends Under<'literal.string.raw'> = 'literal.string.raw'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by pr
			readonly $kind: K;
			readonly content: Slot<G, 'literal.string.raw', 'content', V.Literal.String.Text<G>>;
			// r only
		}
		export namespace Raw {
			export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.raw.multiline'> = 'literal.string.raw.multiline'> extends SubKindOf<V.Literal.String.Raw<G, K>> {
				// claimed by p
				readonly $kind: K;
			}
		}
	}
}
