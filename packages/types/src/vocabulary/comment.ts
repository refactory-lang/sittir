// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';

import type { Simplify } from 'type-fest';

import type { SubKindOf } from './utils.ts';

import type * as V from './index.ts';

export interface Comment<G extends GrammarContext> {
	// claimed by t
	readonly kind: 'comment';
}

export namespace Comment {
	export interface Block<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment<G>>> {
		// claimed by rt
		readonly kind: 'comment.block';
		readonly content?:
			| V.Unmapped<'rust:block_comment_content'>
			| V.Unmapped<'rust:block_comment_doc_inner'>
			| V.Unmapped<'rust:block_comment_doc_outer'>;
		// r only
		// unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
	}
	export namespace Block {
		export interface Doc<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment.Block<G>>> {
			// claimed by rt
			readonly kind: 'comment.block.doc';
			readonly content?:
				| V.Unmapped<'rust:block_comment_content'>
				| V.Unmapped<'rust:block_comment_doc_inner'>
				| V.Unmapped<'rust:block_comment_doc_outer'>;
			// r only
			// unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment.Block.Doc<G>>> {
				// claimed by r
				readonly kind: 'comment.block.doc.inner';
				readonly content?:
					| V.Unmapped<'rust:block_comment_content'>
					| V.Unmapped<'rust:block_comment_doc_inner'>
					| V.Unmapped<'rust:block_comment_doc_outer'>;
				// unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
			}
			export type Any<G extends GrammarContext> = V.Comment.Block.Doc<G> | V.Comment.Block.Doc.Inner<G>;
		}
		export type Any<G extends GrammarContext> =
			| V.Comment.Block<G>
			| V.Comment.Block.Doc<G>
			| V.Comment.Block.Doc.Inner<G>;
	}
	export interface Line<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment<G>>> {
		// claimed by prt
		readonly kind: 'comment.line';
		readonly content:
			| V.Unmapped<'rust:line_comment_doc_inner'>
			| V.Unmapped<'rust:line_comment_doc_outer'>
			| V.Unmapped<'rust:line_comment_extra_slashes'>
			| V.Unmapped<'rust:line_comment_regular'>;
		// pr only
		// unmapped: <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_extra_slashes> <rust:line_comment_regular>
	}
	export namespace Line {
		export interface Doc<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment.Line<G>>> {
			// claimed by r
			readonly kind: 'comment.line.doc';
			readonly content:
				| V.Unmapped<'rust:line_comment_doc_inner'>
				| V.Unmapped<'rust:line_comment_doc_outer'>
				| V.Unmapped<'rust:line_comment_extra_slashes'>
				| V.Unmapped<'rust:line_comment_regular'>;
			// unmapped: <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_extra_slashes> <rust:line_comment_regular>
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext> extends Simplify<SubKindOf<V.Comment.Line.Doc<G>>> {
				// claimed by r
				readonly kind: 'comment.line.doc.inner';
				readonly content:
					| V.Unmapped<'rust:line_comment_doc_inner'>
					| V.Unmapped<'rust:line_comment_doc_outer'>
					| V.Unmapped<'rust:line_comment_extra_slashes'>
					| V.Unmapped<'rust:line_comment_regular'>;
				// unmapped: <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_extra_slashes> <rust:line_comment_regular>
			}
			export type Any<G extends GrammarContext> = V.Comment.Line.Doc<G> | V.Comment.Line.Doc.Inner<G>;
		}
		export type Any<G extends GrammarContext> = V.Comment.Line<G> | V.Comment.Line.Doc<G> | V.Comment.Line.Doc.Inner<G>;
	}
	export type Any<G extends GrammarContext> =
		| V.Comment<G>
		| V.Comment.Block<G>
		| V.Comment.Block.Doc<G>
		| V.Comment.Block.Doc.Inner<G>
		| V.Comment.Line<G>
		| V.Comment.Line.Doc<G>
		| V.Comment.Line.Doc.Inner<G>;
}
