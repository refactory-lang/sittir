import type { GrammarMap } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Comment {
	export interface Html<G extends GrammarMap, K extends Under<'comment.html'> = 'comment.html'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by t
		readonly $path: K;
	}
}
