import type { GrammarMap } from '../../../map.ts';
import type { SubKindOf, Under } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Modifier {
	export namespace Visibility {
		export namespace Public {
			export interface Internal<G extends GrammarMap, K extends Under<'modifier.visibility.public.internal'> = 'modifier.visibility.public.internal'> extends SubKindOf<V.Modifier.Visibility.Public<G, K>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Parent<G extends GrammarMap, K extends Under<'modifier.visibility.public.parent'> = 'modifier.visibility.public.parent'> extends SubKindOf<V.Modifier.Visibility.Public<G, K>> {
				// claimed by r
				readonly $path: K;
			}
			export interface Restricted<G extends GrammarMap, K extends Under<'modifier.visibility.public.restricted'> = 'modifier.visibility.public.restricted'> extends SubKindOf<V.Modifier.Visibility.Public<G, K>> {
				// claimed by r
				readonly $path: K;
			}
		}
	}
}
