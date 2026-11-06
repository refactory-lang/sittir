import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface MappedType<G extends GrammarMap, K extends Under<'clause.mapped_type'> = 'clause.mapped_type'> extends SubKindOf<V.Clause<G, K>> {
		// claimed by t
		readonly $kind: K;
		readonly alias?: Slot<G, K, 'alias', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly type: Slot<G, K, 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
