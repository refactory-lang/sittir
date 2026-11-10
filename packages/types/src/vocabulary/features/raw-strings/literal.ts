import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export namespace Bytes {
			export interface Raw<G extends GrammarMap, K extends Under<'literal.string.bytes.raw'> = 'literal.string.bytes.raw'> extends SubKindOf<V.Literal.String.Bytes<G, K>> {
				// claimed by pr
				readonly $path: K;
				readonly content?: Slot<G, K, 'content', V.Literal.String.Text<G>>;
				// r only
			}
		}
		export interface Raw<G extends GrammarMap, K extends Under<'literal.string.raw'> = 'literal.string.raw'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by pr
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Literal.String.Text<G>>;
			// r only
		}
	}
}
