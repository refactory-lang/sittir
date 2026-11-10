export type * from './clause.ts';

import type { BoundedQuantification } from '../index.ts';

/** Bound clauses: the bounds a type parameter must satisfy, written as a clause. */
export interface BoundClauses extends BoundedQuantification {
	readonly 'bound-clauses': true;
}
