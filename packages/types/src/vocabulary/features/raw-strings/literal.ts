import type { GrammarContext } from '../../context.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export namespace Bytes {
			export interface Raw<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Bytes<G>> {
				// claimed by p
				readonly $kind: 'literal.string.bytes.raw';
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Bytes.Raw<G>> {
					// claimed by p
					readonly $kind: 'literal.string.bytes.raw.multiline';
				}
			}
		}
		export namespace Interpolated {
			export interface Raw<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Interpolated<G>> {
				// claimed by p
				readonly $kind: 'literal.string.interpolated.raw';
			}
			export namespace Raw {
				export interface Multiline<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Interpolated.Raw<G>> {
					// claimed by p
					readonly $kind: 'literal.string.interpolated.raw.multiline';
				}
			}
		}
		export interface Raw<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String<G>> {
			// claimed by pr
			readonly $kind: 'literal.string.raw';
			readonly content: G['slots']['literal.string.raw']['content'];
			// r only
		}
		export namespace Raw {
			export interface Multiline<G extends GrammarContext<G>> extends SubKindOf<V.Literal.String.Raw<G>> {
				// claimed by p
				readonly $kind: 'literal.string.raw.multiline';
			}
		}
	}
}
