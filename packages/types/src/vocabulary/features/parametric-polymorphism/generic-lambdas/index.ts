export type * from './expression.ts';

import type { ParametricPolymorphism } from '../index.ts';

/** Generic lambdas: a lambda takes type parameters of its own. */
export interface GenericLambdas extends ParametricPolymorphism {
	readonly 'generic-lambdas': true;
}
