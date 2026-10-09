import type { ParametricPolymorphism } from '../index.ts';
export type * from './clause.ts';

/** Higher-rank polymorphism: a bound quantifies over type parameters of its own. */
export interface HigherRankPolymorphism extends ParametricPolymorphism {
	readonly 'higher-rank-polymorphism': true;
}
