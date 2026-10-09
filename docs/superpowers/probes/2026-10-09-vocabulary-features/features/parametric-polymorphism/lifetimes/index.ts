import type { ParametricPolymorphism } from '../index.ts';
export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './identifier.ts';
export type * from './type.ts';

/** Lifetimes: parameters and bounds naming how long a reference lives. */
export interface Lifetimes extends ParametricPolymorphism {
	readonly lifetimes: true;
}
