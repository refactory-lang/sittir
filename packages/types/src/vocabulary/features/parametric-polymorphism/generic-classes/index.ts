export type * from './declaration.ts';

import type { ParametricPolymorphism } from '../index.ts';
import type { Classes } from '../../methods/classes/index.ts';

/** Generic classes: a class declared with type parameters. */
export interface GenericClasses extends ParametricPolymorphism, Classes {
	readonly 'generic-classes': true;
}
