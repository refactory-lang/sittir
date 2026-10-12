export * from './clause.ts';
export * from './declaration.ts';
export * from './identifier.ts';
export * from './type.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Lifetimes: parameters and bounds naming how long a reference lives. */
export interface Lifetimes extends ParametricPolymorphism {
	readonly lifetimes: true;
}
