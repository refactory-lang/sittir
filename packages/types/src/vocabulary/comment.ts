import type { GrammarContext } from './context.ts';
import type { SubKindOf } from './utils.ts';
import type * as V from './index.ts';
export interface Comment<G extends GrammarContext<G>> {
	// claimed by t
	readonly $kind: 'comment';
	readonly content?: G['slots']['comment']['content'];
	// prt only
}

export namespace Comment {
	export interface Block<G extends GrammarContext<G>> extends SubKindOf<V.Comment<G>> {
		// claimed by rt
		readonly $kind: 'comment.block';
		readonly content?: G['slots']['comment.block']['content'];
		// r only
	}
	export namespace Block {
		export interface Doc<G extends GrammarContext<G>> extends SubKindOf<V.Comment.Block<G>> {
			// claimed by rt
			readonly $kind: 'comment.block.doc';
			readonly content?: G['slots']['comment.block.doc']['content'];
			// r only
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext<G>> extends SubKindOf<V.Comment.Block.Doc<G>> {
				// claimed by r
				readonly $kind: 'comment.block.doc.inner';
				readonly content?: G['slots']['comment.block.doc.inner']['content'];
			}
			export type Any<G extends GrammarContext<G>> = V.Comment.Block.Doc<G> | V.Comment.Block.Doc.Inner<G>;
		}
		export type Any<G extends GrammarContext<G>> =
			| V.Comment.Block<G>
			| V.Comment.Block.Doc<G>
			| V.Comment.Block.Doc.Inner<G>;
	}
	export interface Line<G extends GrammarContext<G>> extends SubKindOf<V.Comment<G>> {
		// claimed by prt
		readonly $kind: 'comment.line';
		readonly content: G['slots']['comment.line']['content'];
		// pr only
	}
	export namespace Line {
		export interface Doc<G extends GrammarContext<G>> extends SubKindOf<V.Comment.Line<G>> {
			// claimed by r
			readonly $kind: 'comment.line.doc';
			readonly content: G['slots']['comment.line.doc']['content'];
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext<G>> extends SubKindOf<V.Comment.Line.Doc<G>> {
				// claimed by r
				readonly $kind: 'comment.line.doc.inner';
				readonly content: G['slots']['comment.line.doc.inner']['content'];
			}
			export type Any<G extends GrammarContext<G>> = V.Comment.Line.Doc<G> | V.Comment.Line.Doc.Inner<G>;
		}
		export type Any<G extends GrammarContext<G>> = V.Comment.Line<G> | V.Comment.Line.Doc<G> | V.Comment.Line.Doc.Inner<G>;
	}
	export interface Text<G extends GrammarContext<G>> extends SubKindOf<V.Comment<G>> {
		// claimed by r
		readonly $kind: 'comment.text';
	}
	export type Any<G extends GrammarContext<G>> =
		| V.Comment<G>
		| V.Comment.Block<G>
		| V.Comment.Block.Doc<G>
		| V.Comment.Block.Doc.Inner<G>
		| V.Comment.Line<G>
		| V.Comment.Line.Doc<G>
		| V.Comment.Line.Doc.Inner<G>
		| V.Comment.Text<G>;
}
