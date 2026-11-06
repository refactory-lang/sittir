import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export interface MappedType<G extends GrammarMap> extends SubKindOf<V.Clause<G>> {
		// claimed by t
		readonly $kind: 'clause.mapped_type';
		readonly alias?: Slot<G, 'clause.mapped_type', 'alias', V.Identifier.Any<G> | V.Type.Any<G>>;
		readonly name: V.Identifier<G>;
		readonly type: Slot<G, 'clause.mapped_type', 'type', V.Identifier.Any<G> | V.Type.Any<G>>;
	}
}
