export type * from './pattern.ts';

import type { Destructuring } from '../index.ts';

/** Object patterns: destructuring an object by its keys, with defaults. */
export interface ObjectPatterns extends Destructuring {
	readonly 'object-patterns': true;
}
