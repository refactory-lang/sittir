import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Modifier {
	export namespace Visibility {
		export interface Protected<G extends GrammarMap, K extends Under<'modifier.visibility.protected'> = 'modifier.visibility.protected'> extends SubKindOf<V.Modifier.Visibility<G, K>> {
			// claimed by t
			readonly $path: K;
		}
	}
}
