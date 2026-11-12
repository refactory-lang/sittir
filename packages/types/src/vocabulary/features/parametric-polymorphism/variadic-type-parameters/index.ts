export type * from './declaration.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Variadic type parameters: a type parameter that stands for any number of types. */
export interface VariadicTypeParameters extends ParametricPolymorphism {
	readonly 'variadic-type-parameters': true;
}
