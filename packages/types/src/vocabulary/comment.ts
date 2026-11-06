import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Comment<G extends GrammarMap> {
	readonly $kind: 'comment';
	readonly content?: Slot<G, 'comment', 'content', unknown>;
	// prt only
}

export namespace Comment {
	export interface Block<G extends GrammarMap> extends SubKindOf<V.Comment<G>, 'content'> {
		// claimed by rt
		readonly $kind: 'comment.block';
		readonly content?: Slot<G, 'comment.block', 'content', unknown>;
		// r only
	}
	export namespace Block {
		export interface Doc<G extends GrammarMap> extends SubKindOf<V.Comment.Block<G>, 'content'> {
			// claimed by rt
			readonly $kind: 'comment.block.doc';
			readonly content?: Slot<G, 'comment.block.doc', 'content', unknown>;
			// r only
		}
		export namespace Doc {
			export interface Inner<G extends GrammarMap> extends SubKindOf<V.Comment.Block.Doc<G>, 'content'> {
				// claimed by r
				readonly $kind: 'comment.block.doc.inner';
				readonly content?: Slot<G, 'comment.block.doc.inner', 'content', unknown>;
			}
		}
	}
	export interface Html<G extends GrammarMap> extends SubKindOf<V.Comment<G>> {
		// claimed by t
		readonly $kind: 'comment.html';
	}
	export interface Line<G extends GrammarMap> extends SubKindOf<V.Comment<G>, 'content'> {
		// claimed by prt
		readonly $kind: 'comment.line';
		readonly content: Slot<G, 'comment.line', 'content', V.Comment.Text<G>>;
		// pr only
	}
	export namespace Line {
		export interface Doc<G extends GrammarMap> extends SubKindOf<V.Comment.Line<G>, 'content'> {
			// claimed by r
			readonly $kind: 'comment.line.doc';
			readonly content: Slot<G, 'comment.line.doc', 'content', V.Comment.Text<G>>;
		}
		export namespace Doc {
			export interface Inner<G extends GrammarMap> extends SubKindOf<V.Comment.Line.Doc<G>, 'content'> {
				// claimed by r
				readonly $kind: 'comment.line.doc.inner';
				readonly content: Slot<G, 'comment.line.doc.inner', 'content', V.Comment.Text<G>>;
			}
		}
	}
	export interface Text<G extends GrammarMap> extends SubKindOf<V.Comment<G>> {
		// claimed by r
		readonly $kind: 'comment.text';
	}
}
