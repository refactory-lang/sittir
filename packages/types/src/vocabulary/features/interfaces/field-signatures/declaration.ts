import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export namespace Member {
		export namespace Field {
			export interface Signature<G extends GrammarMap, K extends Under<'declaration.member.field.signature'> = 'declaration.member.field.signature'> extends SubKindOf<V.Declaration.Member.Field<G, K>, 'name' | 'optional' | 'override' | 'readonly' | 'static' | 'type'> {
				// claimed by t
				readonly $path: K;
				readonly name: Slot<G, K, 'name', V.Expression.Any<G> | string>;
			}
		}
	}
}
