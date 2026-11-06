import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Literal {
	export namespace String {
		export interface Bytes<G extends GrammarMap> extends SubKindOf<V.Literal.String<G>> {
			// claimed by p
			readonly $kind: 'literal.string.bytes';
		}
		export namespace Bytes {
			export interface Multiline<G extends GrammarMap> extends SubKindOf<V.Literal.String.Bytes<G>> {
				// claimed by p
				readonly $kind: 'literal.string.bytes.multiline';
			}
		}
	}
}
