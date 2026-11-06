import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Extends {
		export interface Type<G extends GrammarMap> extends SubKindOf<V.Clause.Extends<G>, 'types'> {
			// claimed by t
			readonly $kind: 'clause.extends.type';
			readonly types: Slot<G, 'clause.extends.type', 'types', V.Identifier<G> | V.Type.Any<G> | V.Identifier.Any<G>>[];
		}
	}
}
