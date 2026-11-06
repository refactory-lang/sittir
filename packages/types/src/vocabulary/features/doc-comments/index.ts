export type * from './comment.ts';

import type { BlockComments } from '../block-comments/index.ts';

/** Doc comments: a block comment that documents the declaration after it. */
export interface DocComments extends BlockComments {
	readonly 'doc-comments': true;
}
