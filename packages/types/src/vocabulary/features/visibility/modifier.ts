import type { GrammarMap } from '../../map.ts';
import type { SubKindOf } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Modifier {
	export interface Visibility<G extends GrammarMap> extends SubKindOf<V.Modifier<G>> {
		// claimed by t
		readonly $kind: 'modifier.visibility';
	}
	export namespace Visibility {
		export interface Private<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by rt
			readonly $kind: 'modifier.visibility.private';
		}
		export interface Protected<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by t
			readonly $kind: 'modifier.visibility.protected';
		}
		export interface Public<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility<G>> {
			// claimed by rt
			readonly $kind: 'modifier.visibility.public';
		}
		export namespace Public {
			export interface Internal<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'modifier.visibility.public.internal';
			}
			export interface Parent<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'modifier.visibility.public.parent';
			}
			export interface Restricted<G extends GrammarMap> extends SubKindOf<V.Modifier.Visibility.Public<G>> {
				// claimed by r
				readonly $kind: 'modifier.visibility.public.restricted';
			}
		}
	}
}
