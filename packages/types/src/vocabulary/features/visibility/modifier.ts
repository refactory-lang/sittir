import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Modifier {
	export interface Visibility<G extends GrammarMap, K extends Under<'modifier.visibility'> = 'modifier.visibility'> extends SubKindOf<V.Modifier<G, K>> {
		// claimed by t
		readonly $path: K;
	}
	export namespace Visibility {
		export interface Private<G extends GrammarMap, K extends Under<'modifier.visibility.private'> = 'modifier.visibility.private'> extends SubKindOf<V.Modifier.Visibility<G, K>> {
			// claimed by rt
			readonly $path: K;
		}
		export interface Protected<G extends GrammarMap, K extends Under<'modifier.visibility.protected'> = 'modifier.visibility.protected'> extends SubKindOf<V.Modifier.Visibility<G, K>> {
			// claimed by t
			readonly $path: K;
		}
		export interface Public<G extends GrammarMap, K extends Under<'modifier.visibility.public'> = 'modifier.visibility.public'> extends SubKindOf<V.Modifier.Visibility<G, K>> {
			// claimed by rt
			readonly $path: K;
		}
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
