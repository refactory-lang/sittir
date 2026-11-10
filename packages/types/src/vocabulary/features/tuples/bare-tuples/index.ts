export type * from './expression.ts';

import type { Tuples } from '../index.ts';

/** Bare tuples: a tuple written without parentheses. */
export interface BareTuples extends Tuples {
	readonly 'bare-tuples': true;
}
