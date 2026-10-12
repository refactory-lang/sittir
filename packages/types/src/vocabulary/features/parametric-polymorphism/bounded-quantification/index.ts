export * from './clause.ts';
export * from './declaration.ts';
export * from './element.ts';
export * from './type.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Bounded quantification: bounds a type parameter must satisfy, in its constraint and in where clauses. */
export interface BoundedQuantification extends ParametricPolymorphism {
	readonly 'bounded-quantification': true;
}
