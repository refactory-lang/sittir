import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Comment {
	export namespace Block {
		export interface Doc<G extends GrammarMap, K extends Under<'comment.block.doc'> = 'comment.block.doc'> extends SubKindOf<V.Comment.Block<G, K>> {
			// claimed by rt
			readonly $path: K;
			readonly content?: Slot<G, K, 'content', unknown>;
			// r only
		}
	}
}
