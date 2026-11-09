export type * from './comment.ts';

import type { LineDocComments } from '../line-doc-comments/index.ts';

/** Inner doc comments: a doc comment that documents the item it sits in. */
export interface InnerDocComments extends LineDocComments {
	readonly 'inner-doc-comments': true;
}
