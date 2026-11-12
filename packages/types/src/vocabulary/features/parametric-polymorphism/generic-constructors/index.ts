export type * from './declaration.ts';

import type { ParametricPolymorphism } from '../index.ts';
import type { Classes } from '../../methods/classes/index.ts';

/** Generic constructors: a constructor declared with type parameters of its own. */
export interface GenericConstructors extends ParametricPolymorphism, Classes {
	readonly 'generic-constructors': true;
}
