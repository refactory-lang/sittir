export type * from './declaration.ts';

import type { Interfaces } from '../index.ts';

/** Traits: an interface a type implements apart from its declaration. */
export interface Traits extends Interfaces {
	readonly traits: true;
}
