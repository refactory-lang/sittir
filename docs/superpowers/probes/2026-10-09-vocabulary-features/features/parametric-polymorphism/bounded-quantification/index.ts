import type { ParametricPolymorphism } from '../index.ts';
export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './element.ts';
export type * from './type.ts';

/** Bounded quantification: bounds a type parameter must satisfy, in its constraint and in where clauses. */
export interface BoundedQuantification extends ParametricPolymorphism {
	readonly 'bounded-quantification': true;
}
