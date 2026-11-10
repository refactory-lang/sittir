export type * from './pattern.ts';

import type { Destructuring } from '../index.ts';

/** Rest patterns: a pattern that binds the elements no other pattern takes. */
export interface RestPatterns extends Destructuring {
	readonly 'rest-patterns': true;
}
