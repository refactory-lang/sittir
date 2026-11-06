import type { GrammarMap, Slot } from '../../../map.ts';
import type * as V from '../../../index.ts';
export namespace Modifier {
	export namespace Visibility {
		export namespace Public {
			export interface Restricted<G extends GrammarMap> {
				readonly scope: Slot<G, 'modifier.visibility.public.restricted', 'scope', V.Identifier.Any<G>>;
				// r only
			}
		}
	}
}
