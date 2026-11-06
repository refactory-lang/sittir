export type * from './pattern.ts';

import type { Destructuring } from '../index.ts';

/** Wildcard patterns: a pattern that matches anything and binds nothing. */
export interface WildcardPatterns extends Destructuring {
	readonly 'wildcard-patterns': true;
}
