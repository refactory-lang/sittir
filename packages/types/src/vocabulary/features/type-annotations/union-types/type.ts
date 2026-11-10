import type { GrammarMap, Slot } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Type {
	export interface Rest<G extends GrammarMap, K extends Under<'type.rest'> = 'type.rest'> extends SubKindOf<V.Type<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
	export interface Union<G extends GrammarMap, K extends Under<'type.union'> = 'type.union'> extends SubKindOf<V.Type<G, K>> {
		// claimed by pt
		readonly $path: K;
		readonly left?: Slot<G, K, 'left', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly right: Slot<G, K, 'right', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
