export type * from './declaration.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Parameter specifications: a type parameter that stands for a parameter list. */
export interface ParamSpecs extends ParametricPolymorphism {
	readonly 'param-specs': true;
}
