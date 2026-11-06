import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface Default<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.default';
		readonly type: Slot<G, 'clause.default', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
