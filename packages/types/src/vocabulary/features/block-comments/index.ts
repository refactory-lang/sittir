export type * from './comment.ts';

/** Block comments: a comment between delimiters that can span lines. */
export interface BlockComments {
	readonly 'block-comments': true;
}
