import type { TypeAliases } from '../index.ts';
import type { Interfaces } from '../../interfaces/index.ts';
export type * from './declaration.ts';
export type * from './element.ts';

/** Associated types: a type an interface declares as a member, which each implementation binds. */
export interface AssociatedTypes extends TypeAliases, Interfaces {
	readonly 'associated-types': true;
}
