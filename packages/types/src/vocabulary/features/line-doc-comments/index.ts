export type * from './comment.ts';

import type { DocComments } from '../doc-comments/index.ts';

/** Line doc comments: a line comment that documents the declaration after it. */
export interface LineDocComments extends DocComments {
	readonly 'line-doc-comments': true;
}
