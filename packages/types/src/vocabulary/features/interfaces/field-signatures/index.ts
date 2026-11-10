export type * from './declaration.ts';

import type { Interfaces } from '../index.ts';

/** Field signatures: a field declared on an interface, without a value. */
export interface FieldSignatures extends Interfaces {
	readonly 'field-signatures': true;
}
