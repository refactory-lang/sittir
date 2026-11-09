export type * from './expression.ts';
export type * from './type.ts';

import type { TypeAnnotations } from '../index.ts';

/** Systems types: sized numbers, pointers, references, trait objects, qualified types and conversions. */
export interface SystemsTypes extends TypeAnnotations {
	readonly 'systems-types': true;
}
