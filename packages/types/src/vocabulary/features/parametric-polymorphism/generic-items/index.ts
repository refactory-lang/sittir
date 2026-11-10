export type * from './declaration.ts';
export type * from './element.ts';
export type * from './pattern.ts';
export type * from './type.ts';

import type { ParametricPolymorphism } from '../index.ts';
import type { GenericSignatures } from '../generic-signatures/index.ts';

/** Generic items: type parameters on enums, traits, implementations, aliases and unions. */
export interface GenericItems extends ParametricPolymorphism, GenericSignatures {
	readonly 'generic-items': true;
}
