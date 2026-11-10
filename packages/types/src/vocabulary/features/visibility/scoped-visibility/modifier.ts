import type { GrammarMap, Slot } from '../../../map.ts';
import type { Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Modifier {
	export namespace Visibility {
		export namespace Public {
			export interface Restricted<G extends GrammarMap, K extends Under<'modifier.visibility.public.restricted'> = 'modifier.visibility.public.restricted'> {
				readonly scope: Slot<G, K, 'scope', V.Identifier.Any<G>>;
				// r only
			}
		}
	}
}
