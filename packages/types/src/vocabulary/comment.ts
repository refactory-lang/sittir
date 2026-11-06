import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Comment<G extends GrammarMap, K extends Under<'comment'> = 'comment'> {
	readonly $path: K;
	readonly content?: Slot<G, K, 'content', unknown>;
	// prt only
}

export namespace Comment {
	export interface Block<G extends GrammarMap, K extends Under<'comment.block'> = 'comment.block'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by rt
		readonly $path: K;
		readonly content?: Slot<G, K, 'content', unknown>;
		// r only
	}
	export namespace Block {
		export interface Doc<G extends GrammarMap, K extends Under<'comment.block.doc'> = 'comment.block.doc'> extends SubKindOf<V.Comment.Block<G, K>> {
			// claimed by rt
			readonly $path: K;
			readonly content?: Slot<G, K, 'content', unknown>;
			// r only
		}
		export namespace Doc {
			export interface Inner<G extends GrammarMap, K extends Under<'comment.block.doc.inner'> = 'comment.block.doc.inner'> extends SubKindOf<V.Comment.Block.Doc<G, K>> {
				// claimed by r
				readonly $path: K;
				readonly content?: Slot<G, K, 'content', unknown>;
			}
		}
	}
	export interface Html<G extends GrammarMap, K extends Under<'comment.html'> = 'comment.html'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by t
		readonly $path: K;
	}
	export interface Line<G extends GrammarMap, K extends Under<'comment.line'> = 'comment.line'> extends SubKindOf<V.Comment<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly content: Slot<G, K, 'content', V.Comment.Text<G> | string>;
		// pr only
	}
	export namespace Line {
		export interface Doc<G extends GrammarMap, K extends Under<'comment.line.doc'> = 'comment.line.doc'> extends SubKindOf<V.Comment.Line<G, K>> {
			// claimed by r
			readonly $path: K;
			readonly content: Slot<G, K, 'content', V.Comment.Text<G>>;
		}
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
