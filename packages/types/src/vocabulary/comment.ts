// Generated from the grammars' bindings.scm and slot models. Do not edit.
import type { GrammarContext } from './context.ts';
import type * as V from './index.ts';

export interface Comment<G extends GrammarContext> {
	// claimed by t
	readonly content?:
		| V.Unmapped<'rust:block_comment_content'>
		| V.Unmapped<'rust:block_comment_doc_inner'>
		| V.Unmapped<'rust:block_comment_doc_outer'>
		| V.Unmapped<'rust:line_comment_content'>
		| V.Unmapped<'rust:line_comment_doc_inner'>
		| V.Unmapped<'rust:line_comment_doc_outer'>
		| V.Unmapped<'rust:line_comment_regular_dslash'>; // r only   // unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer> <rust:line_comment_content> <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_regular_dslash>
}
export namespace Comment {
	export interface Block<G extends GrammarContext> extends V.Comment<G> {
		// claimed by rt
		readonly content?:
			| V.Unmapped<'rust:block_comment_content'>
			| V.Unmapped<'rust:block_comment_doc_inner'>
			| V.Unmapped<'rust:block_comment_doc_outer'>; // r only   // unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
	}
	export namespace Block {
		export interface Doc<G extends GrammarContext> extends V.Comment.Block<G> {
			// claimed by rt
			readonly content?:
				| V.Unmapped<'rust:block_comment_content'>
				| V.Unmapped<'rust:block_comment_doc_inner'>
				| V.Unmapped<'rust:block_comment_doc_outer'>; // r only   // unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext> extends V.Comment.Block.Doc<G> {
				// claimed by r
				readonly content?:
					| V.Unmapped<'rust:block_comment_content'>
					| V.Unmapped<'rust:block_comment_doc_inner'>
					| V.Unmapped<'rust:block_comment_doc_outer'>; // unmapped: <rust:block_comment_content> <rust:block_comment_doc_inner> <rust:block_comment_doc_outer>
			}
			export type Kinds<G extends GrammarContext> = V.Comment.Block.Doc.Inner<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Comment.Block.Doc.Inner<G>;
	}
	export interface Line<G extends GrammarContext> extends V.Comment<G> {
		// claimed by prt
		readonly content:
			| V.Unmapped<'rust:line_comment_content'>
			| V.Unmapped<'rust:line_comment_doc_inner'>
			| V.Unmapped<'rust:line_comment_doc_outer'>
			| V.Unmapped<'rust:line_comment_regular_dslash'>; // r only   // unmapped: <rust:line_comment_content> <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_regular_dslash>
	}
	export namespace Line {
		export interface Doc<G extends GrammarContext> extends V.Comment.Line<G> {
			// claimed by r
			readonly content:
				| V.Unmapped<'rust:line_comment_content'>
				| V.Unmapped<'rust:line_comment_doc_inner'>
				| V.Unmapped<'rust:line_comment_doc_outer'>
				| V.Unmapped<'rust:line_comment_regular_dslash'>; // unmapped: <rust:line_comment_content> <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_regular_dslash>
		}
		export namespace Doc {
			export interface Inner<G extends GrammarContext> extends V.Comment.Line.Doc<G> {
				// claimed by r
				readonly content:
					| V.Unmapped<'rust:line_comment_content'>
					| V.Unmapped<'rust:line_comment_doc_inner'>
					| V.Unmapped<'rust:line_comment_doc_outer'>
					| V.Unmapped<'rust:line_comment_regular_dslash'>; // unmapped: <rust:line_comment_content> <rust:line_comment_doc_inner> <rust:line_comment_doc_outer> <rust:line_comment_regular_dslash>
			}
			export type Kinds<G extends GrammarContext> = V.Comment.Line.Doc.Inner<G>;
		}
		export type Kinds<G extends GrammarContext> = V.Comment.Line.Doc.Inner<G>;
	}
	export type Kinds<G extends GrammarContext> = V.Comment.Block.Doc.Inner<G> | V.Comment.Line.Doc.Inner<G>;
}
