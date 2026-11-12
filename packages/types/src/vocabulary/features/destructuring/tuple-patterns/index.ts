export type * from './pattern.ts';

import type { Destructuring } from '../index.ts';

/** Tuple patterns: destructuring a tuple by position. */
export interface TuplePatterns extends Destructuring {
	readonly 'tuple-patterns': true;
}
