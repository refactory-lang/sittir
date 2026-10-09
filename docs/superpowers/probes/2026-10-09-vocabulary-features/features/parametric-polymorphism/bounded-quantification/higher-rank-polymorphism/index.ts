import type { BoundedQuantification } from '../index.ts';
export type * from './clause.ts';

/** Higher-rank polymorphism: a bound quantifies over type parameters of its own. */
export interface HigherRankPolymorphism extends BoundedQuantification {
	readonly 'higher-rank-polymorphism': true;
}
