import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Clause {
	export namespace Extends {
		export interface Type<G extends GrammarMap, K extends Under<'clause.extends.type'> = 'clause.extends.type'> extends SubKindOf<V.Clause.Extends<G, K>> {
			// claimed by t
			readonly $path: K;
			readonly types: Slot<G, K, 'types', V.Identifier<G> | V.Type.Any<G> | V.Identifier.Any<G>>[];
		}
	}
}
