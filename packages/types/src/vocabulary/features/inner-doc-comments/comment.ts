import type { GrammarMap, Slot } from '../../map.ts';
import type { SubKindOf, Under } from '../../utils.ts';
import type * as V from '../../index.ts';
export namespace Comment {
	export namespace Block {
		export namespace Doc {
			export interface Inner<G extends GrammarMap, K extends Under<'comment.block.doc.inner'> = 'comment.block.doc.inner'> extends SubKindOf<V.Comment.Block.Doc<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly content?: Slot<G, K, 'content', unknown>;
			}
		}
	}
	export namespace Line {
		export namespace Doc {
			export interface Inner<G extends GrammarMap, K extends Under<'comment.line.doc.inner'> = 'comment.line.doc.inner'> extends SubKindOf<V.Comment.Line.Doc<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly content: Slot<G, K, 'content', V.Comment.Text<G>>;
			}
		}
	}
	export interface Text<G extends GrammarMap, K extends Under<'comment.text'> = 'comment.text'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by r
		readonly $path: K;
	}
}
