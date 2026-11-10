export type * from './comment.ts';

/** HTML comments: `<!--` and `-->` read as comments. */
export interface HtmlComments {
	readonly 'html-comments': true;
}
