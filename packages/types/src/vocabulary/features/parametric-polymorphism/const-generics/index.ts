export type * from './declaration.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Const generics: a type parameter that is a value. */
export interface ConstGenerics extends ParametricPolymorphism {
	readonly 'const-generics': true;
}
