import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Extends {
		export interface Type<G extends GrammarMap, K extends Under<'clause.extends.type'> = 'clause.extends.type'> extends SubKindOf<V.Clause.Extends<G, K>, 'types'> {
			// claimed by t
			readonly $kind: K;
			readonly types: Slot<G, 'clause.extends.type', 'types', V.Identifier<G> | V.Type.Any<G> | V.Identifier.Any<G>>[];
		}
	}
}
