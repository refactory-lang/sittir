import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Comment {
	export namespace Line {
		export interface Doc<G extends GrammarMap, K extends Under<'comment.line.doc'> = 'comment.line.doc'> extends SubKindOf<V.Comment.Line<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Comment.Text<G>>;
		}
	}
}
