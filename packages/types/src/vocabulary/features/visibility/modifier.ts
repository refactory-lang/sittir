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
		export interface Public<G extends GrammarMap, K extends Under<'modifier.visibility.public'> = 'modifier.visibility.public'> extends SubKindOf<V.Modifier.Visibility<G, K>> {
			// claimed by rt
			readonly $path: K;
		}
	}
}
