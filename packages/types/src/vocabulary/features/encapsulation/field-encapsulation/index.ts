export type * from './declaration.ts';

import type { Encapsulation } from '../index.ts';
import type { FieldsAndModifiers } from '../../fields-and-modifiers/index.ts';
import type { Accessors } from '../../methods/accessors/index.ts';

/** Field encapsulation: a field or property hidden from code outside its class. */
export interface FieldEncapsulation extends Encapsulation, FieldsAndModifiers, Accessors {
	readonly 'field-encapsulation': true;
}
