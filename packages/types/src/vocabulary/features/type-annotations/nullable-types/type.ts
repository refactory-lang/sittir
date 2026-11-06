import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Nullable<G extends GrammarMap, K extends Under<'type.nullable'> = 'type.nullable'> extends SubKindOf<V.Type<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
