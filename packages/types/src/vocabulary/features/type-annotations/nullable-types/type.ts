import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Nullable<G extends GrammarMap> extends SubKindOf<V.Type<G>> {
		// claimed by t
		readonly $kind: 'type.nullable';
		readonly type: Slot<G, 'type.nullable', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
