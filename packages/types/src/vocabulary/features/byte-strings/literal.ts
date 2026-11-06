import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Bytes<G extends GrammarMap, K extends Under<'literal.string.bytes'> = 'literal.string.bytes'> extends SubKindOf<V.Literal.String<G, K>> {
			// claimed by p
			readonly $path: K;
		}
		export namespace Bytes {
			export interface Multiline<G extends GrammarMap, K extends Under<'literal.string.bytes.multiline'> = 'literal.string.bytes.multiline'> extends SubKindOf<V.Literal.String.Bytes<G, K>> {
				// claimed by p
				readonly $path: K;
			}
		}
	}
}
