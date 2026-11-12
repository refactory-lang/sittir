export type * from './expression.ts';

import type { StringInterpolation } from '../index.ts';

/** Tagged templates: a template string passed to a function. */
export interface TaggedTemplates extends StringInterpolation {
	readonly 'tagged-templates': true;
}
