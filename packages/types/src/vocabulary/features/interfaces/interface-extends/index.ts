export type * from './clause.ts';

import type { Interfaces } from '../index.ts';

/** Interface extension: an interface that extends other types. */
export interface InterfaceExtends extends Interfaces {
	readonly 'interface-extends': true;
}
