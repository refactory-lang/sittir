export * from './declaration.ts';

import type { Enumerations } from '../index.ts';

/** Algebraic data types: a sum type whose variants carry fields. */
export interface AlgebraicDataTypes extends Enumerations {
	readonly 'algebraic-data-types': true;
}
